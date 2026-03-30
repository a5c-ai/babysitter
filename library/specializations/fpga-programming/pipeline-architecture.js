/**
 * @process specializations/fpga-programming/pipeline-architecture
 * @description Pipeline Architecture Implementation - Design and implement pipelined architectures to achieve high
 * throughput. Balance pipeline stages for timing closure while managing hazards and data dependencies.
 * @inputs { pipelineName: string, operations: array, targetFrequency?: number, targetDevice?: string, hazardHandling?: string, outputDir?: string }
 * @outputs { success: boolean, pipelineFiles: object, timingReport: object, throughputAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/pipeline-architecture', {
 *   pipelineName: 'dsp_pipeline',
 *   operations: ['fetch', 'decode', 'multiply', 'accumulate', 'output'],
 *   targetFrequency: 250,
 *   targetDevice: 'Xilinx UltraScale+',
 *   hazardHandling: 'forwarding'
 * });
 *
 * @references
 * - Pipeline Design: https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
 * - High-Performance FPGA Design: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
 * - Pipelining Techniques: https://zipcpu.com/blog/2017/08/14/strategies-for-pipelining.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    pipelineName,
    operations,
    targetFrequency = 200, // MHz
    targetDevice = 'Generic FPGA',
    hazardHandling = 'stall', // 'stall', 'forwarding', 'none'
    dataWidth = 32,
    backpressureSupport = true,
    flushSupport = true,
    language = 'SystemVerilog',
    outputDir = 'pipeline-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Pipeline Architecture: ${pipelineName}`);
  ctx.log('info', `Stages: ${operations.length}, Target: ${targetFrequency}MHz, Hazard: ${hazardHandling}`);

  // ============================================================================
  // PHASE 1: PIPELINE SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Pipeline Specification and Requirements');

  const specification = await ctx.task(pipelineSpecificationTask, {
    pipelineName,
    operations,
    targetFrequency,
    targetDevice,
    dataWidth,
    backpressureSupport,
    flushSupport,
    outputDir
  });

  artifacts.push(...specification.artifacts);

  // ============================================================================
  // PHASE 2: STAGE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Pipeline Stage Definition');

  const stageDefinition = await ctx.task(stageDefinitionTask, {
    pipelineName,
    operations,
    dataWidth,
    targetFrequency,
    specification,
    outputDir
  });

  artifacts.push(...stageDefinition.artifacts);

  // Quality Gate: Stage review
  await ctx.breakpoint({
    question: `Pipeline stages defined for ${pipelineName}. ${stageDefinition.stageCount} stages, estimated latency: ${stageDefinition.estimatedLatency} cycles. Review stage definitions?`,
    title: 'Pipeline Stage Review',
    context: {
      runId: ctx.runId,
      pipelineName,
      stages: stageDefinition.stages,
      estimatedLatency: stageDefinition.estimatedLatency,
      files: stageDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: INTER-STAGE REGISTER DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Inter-Stage Register Design');

  const registerDesign = await ctx.task(interStageRegisterTask, {
    pipelineName,
    stageDefinition,
    dataWidth,
    backpressureSupport,
    flushSupport,
    outputDir
  });

  artifacts.push(...registerDesign.artifacts);

  // ============================================================================
  // PHASE 4: HAZARD ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Hazard Analysis');

  const hazardAnalysis = await ctx.task(hazardAnalysisTask, {
    pipelineName,
    operations,
    stageDefinition,
    hazardHandling,
    outputDir
  });

  artifacts.push(...hazardAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: HAZARD RESOLUTION LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 5: Hazard Resolution Logic');

  const hazardResolution = await ctx.task(hazardResolutionTask, {
    pipelineName,
    hazardAnalysis,
    hazardHandling,
    stageDefinition,
    outputDir
  });

  artifacts.push(...hazardResolution.artifacts);

  // ============================================================================
  // PHASE 6: CONTROL LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 6: Pipeline Control Logic');

  const controlLogic = await ctx.task(pipelineControlTask, {
    pipelineName,
    stageDefinition,
    hazardResolution,
    backpressureSupport,
    flushSupport,
    outputDir
  });

  artifacts.push(...controlLogic.artifacts);

  // ============================================================================
  // PHASE 7: RTL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Pipeline RTL Implementation');

  const rtlImplementation = await ctx.task(pipelineRtlTask, {
    pipelineName,
    language,
    stageDefinition,
    registerDesign,
    hazardResolution,
    controlLogic,
    dataWidth,
    outputDir
  });

  artifacts.push(...rtlImplementation.artifacts);

  // ============================================================================
  // PHASE 8: TIMING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Pipeline Timing Analysis');

  const timingAnalysis = await ctx.task(pipelineTimingTask, {
    pipelineName,
    targetFrequency,
    targetDevice,
    stageDefinition,
    rtlImplementation,
    outputDir
  });

  artifacts.push(...timingAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: THROUGHPUT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Throughput and Performance Analysis');

  const throughputAnalysis = await ctx.task(throughputAnalysisTask, {
    pipelineName,
    stageDefinition,
    hazardAnalysis,
    controlLogic,
    targetFrequency,
    outputDir
  });

  artifacts.push(...throughputAnalysis.artifacts);

  // ============================================================================
  // PHASE 10: TESTBENCH AND VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Pipeline Testbench Development');

  const testbench = await ctx.task(pipelineTestbenchTask, {
    pipelineName,
    language,
    stageDefinition,
    hazardHandling,
    backpressureSupport,
    flushSupport,
    outputDir
  });

  artifacts.push(...testbench.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Pipeline Architecture Complete for ${pipelineName}. ${stageDefinition.stageCount} stages, ${throughputAnalysis.effectiveThroughput}. Timing: ${timingAnalysis.timingMet ? 'MET' : 'FAILED'}. Review pipeline package?`,
    title: 'Pipeline Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        pipelineName,
        stageCount: stageDefinition.stageCount,
        latencyCycles: stageDefinition.estimatedLatency,
        targetFrequency,
        timingMet: timingAnalysis.timingMet,
        effectiveThroughput: throughputAnalysis.effectiveThroughput,
        hazardHandling
      },
      files: [
        { path: rtlImplementation.pipelineFilePath, format: 'sv', label: 'Pipeline RTL' },
        { path: testbench.testbenchPath, format: 'sv', label: 'Testbench' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: timingAnalysis.timingMet,
    pipelineName,
    pipelineFiles: {
      rtl: rtlImplementation.pipelineFilePath,
      stages: rtlImplementation.stageFiles,
      testbench: testbench.testbenchPath
    },
    timingReport: {
      targetFrequency,
      achievedFrequency: timingAnalysis.achievedFrequency,
      timingMet: timingAnalysis.timingMet,
      criticalPath: timingAnalysis.criticalPath,
      worstSlack: timingAnalysis.worstSlack
    },
    throughputAnalysis: {
      theoreticalThroughput: throughputAnalysis.theoreticalThroughput,
      effectiveThroughput: throughputAnalysis.effectiveThroughput,
      stallCycles: throughputAnalysis.stallCycles,
      efficiency: throughputAnalysis.efficiency
    },
    design: {
      stageCount: stageDefinition.stageCount,
      latencyCycles: stageDefinition.estimatedLatency,
      hazardHandling,
      backpressureSupport,
      flushSupport
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/pipeline-architecture',
      timestamp: startTime,
      pipelineName,
      targetFrequency,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const pipelineSpecificationTask = defineTask('pipeline-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pipeline Specification - ${args.pipelineName}`,
  agent: {
    name: 'fpga-architect', // AG-006: FPGA Architect Agent
    prompt: {
      role: 'FPGA Pipeline Architect',
      task: 'Create pipeline specification',
      context: args,
      instructions: [
        '1. Define pipeline throughput requirements',
        '2. Specify latency constraints',
        '3. Document data dependencies',
        '4. Define interface requirements',
        '5. Specify control flow behavior',
        '6. Document exception handling',
        '7. Define resource constraints',
        '8. Specify power requirements',
        '9. Document timing targets',
        '10. Create specification document'
      ],
      outputFormat: 'JSON with pipeline specification'
    },
    outputSchema: {
      type: 'object',
      required: ['throughputReq', 'latencyReq', 'artifacts'],
      properties: {
        throughputReq: { type: 'object' },
        latencyReq: { type: 'object' },
        dataDependencies: { type: 'array', items: { type: 'object' } },
        interfaceSpec: { type: 'object' },
        controlSpec: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'specification']
}));

export const stageDefinitionTask = defineTask('stage-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Stage Definition - ${args.pipelineName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Define pipeline stages',
      context: args,
      instructions: [
        '1. Define each pipeline stage function',
        '2. Identify stage inputs and outputs',
        '3. Estimate combinational delay per stage',
        '4. Balance stage delays',
        '5. Define stage enable signals',
        '6. Identify pipeline registers',
        '7. Document data flow through stages',
        '8. Define stage-specific control',
        '9. Calculate total latency',
        '10. Create stage diagram'
      ],
      outputFormat: 'JSON with stage definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['stageCount', 'stages', 'estimatedLatency', 'artifacts'],
      properties: {
        stageCount: { type: 'number' },
        stages: { type: 'array', items: { type: 'object' } },
        estimatedLatency: { type: 'number' },
        stageDelays: { type: 'array', items: { type: 'number' } },
        dataFlowDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'stages']
}));

export const interStageRegisterTask = defineTask('inter-stage-register', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Inter-Stage Registers - ${args.pipelineName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design inter-stage pipeline registers',
      context: args,
      instructions: [
        '1. Define pipeline register structure',
        '2. Include data signals in register',
        '3. Include valid/enable signals',
        '4. Design register reset behavior',
        '5. Add stall handling logic',
        '6. Add flush handling logic',
        '7. Optimize register width',
        '8. Consider register retiming',
        '9. Document register contents',
        '10. Create register diagram'
      ],
      outputFormat: 'JSON with register design'
    },
    outputSchema: {
      type: 'object',
      required: ['registerCount', 'registerSpec', 'artifacts'],
      properties: {
        registerCount: { type: 'number' },
        registerSpec: { type: 'array', items: { type: 'object' } },
        totalRegisterBits: { type: 'number' },
        controlSignals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'registers']
}));

export const hazardAnalysisTask = defineTask('hazard-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Hazard Analysis - ${args.pipelineName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Analyze pipeline hazards',
      context: args,
      instructions: [
        '1. Identify data hazards (RAW, WAR, WAW)',
        '2. Identify structural hazards',
        '3. Identify control hazards',
        '4. Analyze hazard frequency',
        '5. Determine hazard impact on throughput',
        '6. Identify forwarding opportunities',
        '7. Identify necessary stall conditions',
        '8. Document hazard scenarios',
        '9. Create hazard dependency graph',
        '10. Calculate worst-case stall'
      ],
      outputFormat: 'JSON with hazard analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dataHazards', 'structuralHazards', 'controlHazards', 'artifacts'],
      properties: {
        dataHazards: { type: 'array', items: { type: 'object' } },
        structuralHazards: { type: 'array', items: { type: 'object' } },
        controlHazards: { type: 'array', items: { type: 'object' } },
        hazardFrequency: { type: 'object' },
        forwardingOpportunities: { type: 'array', items: { type: 'object' } },
        worstCaseStall: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'hazards']
}));

export const hazardResolutionTask = defineTask('hazard-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Hazard Resolution - ${args.pipelineName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design hazard resolution logic',
      context: args,
      instructions: [
        '1. Design forwarding paths',
        '2. Design stall generation logic',
        '3. Implement hazard detection unit',
        '4. Design forwarding multiplexers',
        '5. Handle multi-cycle operations',
        '6. Design bubble insertion logic',
        '7. Optimize forwarding network',
        '8. Handle corner cases',
        '9. Document resolution strategy',
        '10. Create resolution diagram'
      ],
      outputFormat: 'JSON with hazard resolution'
    },
    outputSchema: {
      type: 'object',
      required: ['resolutionStrategy', 'forwardingPaths', 'artifacts'],
      properties: {
        resolutionStrategy: { type: 'string' },
        forwardingPaths: { type: 'array', items: { type: 'object' } },
        stallConditions: { type: 'array', items: { type: 'object' } },
        hazardDetectionLogic: { type: 'object' },
        bubbleInsertionPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'hazard-resolution']
}));

export const pipelineControlTask = defineTask('pipeline-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Pipeline Control - ${args.pipelineName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design pipeline control logic',
      context: args,
      instructions: [
        '1. Design pipeline enable logic',
        '2. Implement backpressure handling',
        '3. Design pipeline flush mechanism',
        '4. Create valid signal propagation',
        '5. Design pipeline stall logic',
        '6. Implement ready signal generation',
        '7. Handle pipeline start/stop',
        '8. Design exception handling',
        '9. Document control signals',
        '10. Create control state diagram'
      ],
      outputFormat: 'JSON with pipeline control'
    },
    outputSchema: {
      type: 'object',
      required: ['enableLogic', 'backpressureLogic', 'artifacts'],
      properties: {
        enableLogic: { type: 'object' },
        backpressureLogic: { type: 'object' },
        flushMechanism: { type: 'object' },
        validPropagation: { type: 'object' },
        stallLogic: { type: 'object' },
        controlSignals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'control']
}));

export const pipelineRtlTask = defineTask('pipeline-rtl', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Pipeline RTL - ${args.pipelineName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'HDL Design Engineer',
      task: 'Implement pipeline RTL',
      context: args,
      instructions: [
        '1. Create pipeline top module',
        '2. Implement each stage module',
        '3. Implement inter-stage registers',
        '4. Implement hazard detection',
        '5. Implement forwarding logic',
        '6. Implement control logic',
        '7. Add debug signals',
        '8. Follow synthesis guidelines',
        '9. Add comprehensive comments',
        '10. Create file hierarchy'
      ],
      outputFormat: 'JSON with RTL implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineFilePath', 'stageFiles', 'artifacts'],
      properties: {
        pipelineFilePath: { type: 'string' },
        stageFiles: { type: 'array', items: { type: 'string' } },
        controlFilePath: { type: 'string' },
        hazardFilePath: { type: 'string' },
        moduleCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'rtl']
}));

export const pipelineTimingTask = defineTask('pipeline-timing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Pipeline Timing - ${args.pipelineName}`,
  agent: {
    name: 'fpga-timing-expert', // AG-002: FPGA Timing Expert Agent
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Analyze pipeline timing',
      context: args,
      instructions: [
        '1. Analyze stage timing budgets',
        '2. Identify critical paths',
        '3. Estimate setup slack',
        '4. Estimate hold slack',
        '5. Check clock-to-Q delays',
        '6. Verify routing delays',
        '7. Analyze forwarding path timing',
        '8. Check control path timing',
        '9. Recommend timing fixes',
        '10. Generate timing report'
      ],
      outputFormat: 'JSON with timing analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['timingMet', 'achievedFrequency', 'criticalPath', 'worstSlack', 'artifacts'],
      properties: {
        timingMet: { type: 'boolean' },
        achievedFrequency: { type: 'number' },
        criticalPath: { type: 'object' },
        worstSlack: { type: 'number' },
        stageSlacks: { type: 'array', items: { type: 'object' } },
        timingRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'timing']
}));

export const throughputAnalysisTask = defineTask('throughput-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Throughput Analysis - ${args.pipelineName}`,
  agent: {
    name: 'fpga-architect', // AG-006: FPGA Architect Agent
    prompt: {
      role: 'FPGA Performance Architect',
      task: 'Analyze pipeline throughput',
      context: args,
      instructions: [
        '1. Calculate theoretical throughput',
        '2. Estimate stall frequency',
        '3. Calculate effective throughput',
        '4. Analyze pipeline efficiency',
        '5. Identify throughput bottlenecks',
        '6. Calculate CPI (cycles per instruction)',
        '7. Analyze bandwidth utilization',
        '8. Compare to requirements',
        '9. Recommend optimizations',
        '10. Generate performance report'
      ],
      outputFormat: 'JSON with throughput analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['theoreticalThroughput', 'effectiveThroughput', 'efficiency', 'artifacts'],
      properties: {
        theoreticalThroughput: { type: 'string' },
        effectiveThroughput: { type: 'string' },
        stallCycles: { type: 'object' },
        efficiency: { type: 'string' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        cpi: { type: 'number' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'performance']
}));

export const pipelineTestbenchTask = defineTask('pipeline-testbench', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Pipeline Testbench - ${args.pipelineName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop pipeline testbench',
      context: args,
      instructions: [
        '1. Create testbench with DUT',
        '2. Generate test vectors',
        '3. Test normal operation',
        '4. Test hazard scenarios',
        '5. Test backpressure handling',
        '6. Test flush operation',
        '7. Test stall conditions',
        '8. Verify throughput',
        '9. Check latency',
        '10. Create coverage model'
      ],
      outputFormat: 'JSON with testbench details'
    },
    outputSchema: {
      type: 'object',
      required: ['testbenchPath', 'testScenarios', 'artifacts'],
      properties: {
        testbenchPath: { type: 'string' },
        testScenarios: { type: 'array', items: { type: 'object' } },
        hazardTests: { type: 'array', items: { type: 'object' } },
        backpressureTests: { type: 'array', items: { type: 'object' } },
        coverageModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'pipeline', 'testbench', 'verification']
}));
