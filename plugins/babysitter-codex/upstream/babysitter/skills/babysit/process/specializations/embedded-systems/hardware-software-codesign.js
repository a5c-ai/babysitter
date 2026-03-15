/**
 * @process specializations/embedded-systems/hardware-software-codesign
 * @description Hardware-Software Co-Design - Collaborative design process between hardware and software teams to define
 * interfaces, partition functionality, optimize system architecture, and establish communication protocols between
 * hardware modules.
 * @inputs { projectName: string, systemRequirements: object, hardwareConstraints?: object, outputDir?: string }
 * @outputs { success: boolean, partitioning: object, interfaces: array, architecture: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/hardware-software-codesign', {
 *   projectName: 'SmartSensor',
 *   systemRequirements: { performance: 'high', power: 'low', cost: 'medium' },
 *   hardwareConstraints: { targetMcu: 'STM32L4', budget: '50USD' }
 * });
 *
 * @references
 * - Hardware-Software Co-Design: https://www.embedded.com/hardware-software-co-design-for-embedded-systems/
 * - System Partitioning: https://www.embedded.com/partitioning-hardware-and-software/
 * - Interface Design: https://embeddedartistry.com/blog/2017/02/06/embedded-driver-development-patterns/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    systemRequirements = {},
    hardwareConstraints = {},
    targetLatency = '1ms',
    powerBudget = '100mW',
    costTarget = null,
    outputDir = 'codesign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hardware-Software Co-Design: ${projectName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing System Requirements');

  const requirementsAnalysis = await ctx.task(codesignRequirementsTask, {
    projectName,
    systemRequirements,
    hardwareConstraints,
    targetLatency,
    powerBudget,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: FUNCTIONAL PARTITIONING
  // ============================================================================

  ctx.log('info', 'Phase 2: Partitioning Hardware/Software Functionality');

  const partitioning = await ctx.task(functionalPartitioningTask, {
    projectName,
    requirementsAnalysis,
    hardwareConstraints,
    outputDir
  });

  artifacts.push(...partitioning.artifacts);

  await ctx.breakpoint({
    question: `Functional partitioning complete. HW functions: ${partitioning.hardwareFunctions.length}, SW functions: ${partitioning.softwareFunctions.length}. Review?`,
    title: 'Partitioning Review',
    context: {
      runId: ctx.runId,
      partitioning: partitioning.summary,
      files: partitioning.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: INTERFACE SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Specifying Hardware-Software Interfaces');

  const interfaceSpec = await ctx.task(interfaceSpecificationTask, {
    projectName,
    partitioning,
    hardwareConstraints,
    outputDir
  });

  artifacts.push(...interfaceSpec.artifacts);

  // ============================================================================
  // PHASE 4: COMMUNICATION PROTOCOL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Communication Protocols');

  const protocolDesign = await ctx.task(communicationProtocolDesignTask, {
    projectName,
    interfaceSpec,
    targetLatency,
    outputDir
  });

  artifacts.push(...protocolDesign.artifacts);

  // ============================================================================
  // PHASE 5: ARCHITECTURE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing System Architecture');

  const architectureOptimization = await ctx.task(architectureOptimizationTask, {
    projectName,
    partitioning,
    interfaceSpec,
    protocolDesign,
    powerBudget,
    outputDir
  });

  artifacts.push(...architectureOptimization.artifacts);

  // ============================================================================
  // PHASE 6: TRADEOFF ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Performing Tradeoff Analysis');

  const tradeoffAnalysis = await ctx.task(tradeoffAnalysisTask, {
    projectName,
    partitioning,
    architectureOptimization,
    systemRequirements,
    outputDir
  });

  artifacts.push(...tradeoffAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Co-Design Documentation');

  const documentation = await ctx.task(codesignDocumentationTask, {
    projectName,
    partitioning,
    interfaceSpec,
    protocolDesign,
    architectureOptimization,
    tradeoffAnalysis,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Hardware-Software Co-Design Complete for ${projectName}. Review final architecture?`,
    title: 'Co-Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        hwFunctions: partitioning.hardwareFunctions.length,
        swFunctions: partitioning.softwareFunctions.length,
        interfaces: interfaceSpec.interfaces.length,
        tradeoffs: tradeoffAnalysis.tradeoffs.length
      },
      files: [
        { path: documentation.specPath, format: 'markdown', label: 'Co-Design Spec' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    partitioning: {
      hardware: partitioning.hardwareFunctions,
      software: partitioning.softwareFunctions,
      rationale: partitioning.rationale
    },
    interfaces: interfaceSpec.interfaces,
    architecture: architectureOptimization.architecture,
    tradeoffs: tradeoffAnalysis.tradeoffs,
    specPath: documentation.specPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/hardware-software-codesign',
      timestamp: startTime,
      projectName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const codesignRequirementsTask = defineTask('codesign-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Architect',
      task: 'Analyze co-design requirements',
      context: args,
      instructions: [
        '1. Analyze functional requirements',
        '2. Identify performance requirements',
        '3. Define power constraints',
        '4. Identify cost constraints',
        '5. Analyze timing requirements',
        '6. Identify safety requirements',
        '7. Define interface requirements',
        '8. Analyze reliability requirements',
        '9. Document constraints',
        '10. Prioritize requirements'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['functional', 'performance', 'constraints', 'artifacts'],
      properties: {
        functional: { type: 'array', items: { type: 'object' } },
        performance: { type: 'object' },
        constraints: { type: 'object' },
        priorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'requirements']
}));

export const functionalPartitioningTask = defineTask('functional-partitioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Partitioning - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Architect',
      task: 'Partition functionality between HW and SW',
      context: args,
      instructions: [
        '1. Identify candidate functions',
        '2. Evaluate HW implementation benefits',
        '3. Evaluate SW implementation benefits',
        '4. Consider timing constraints',
        '5. Consider power impact',
        '6. Consider flexibility needs',
        '7. Evaluate cost impact',
        '8. Make partitioning decisions',
        '9. Document rationale',
        '10. Identify interfaces'
      ],
      outputFormat: 'JSON with partitioning decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['hardwareFunctions', 'softwareFunctions', 'rationale', 'summary', 'artifacts'],
      properties: {
        hardwareFunctions: { type: 'array', items: { type: 'object' } },
        softwareFunctions: { type: 'array', items: { type: 'object' } },
        rationale: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'partitioning']
}));

export const interfaceSpecificationTask = defineTask('interface-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Interface Spec - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Architect',
      task: 'Specify HW-SW interfaces',
      context: args,
      instructions: [
        '1. Define register interfaces',
        '2. Specify memory-mapped regions',
        '3. Define interrupt interfaces',
        '4. Specify DMA interfaces',
        '5. Define data formats',
        '6. Specify timing requirements',
        '7. Define error handling',
        '8. Specify access protocols',
        '9. Document interface contracts',
        '10. Create interface diagrams'
      ],
      outputFormat: 'JSON with interface specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'memoryMap', 'artifacts'],
      properties: {
        interfaces: { type: 'array', items: { type: 'object' } },
        memoryMap: { type: 'object' },
        interrupts: { type: 'array', items: { type: 'object' } },
        dataFormats: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'interfaces']
}));

export const communicationProtocolDesignTask = defineTask('communication-protocol-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Protocol Design - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Architect',
      task: 'Design communication protocols',
      context: args,
      instructions: [
        '1. Define protocol requirements',
        '2. Select protocol type',
        '3. Design message formats',
        '4. Define handshaking',
        '5. Specify error handling',
        '6. Design flow control',
        '7. Define timing constraints',
        '8. Specify reliability mechanisms',
        '9. Document protocol spec',
        '10. Create sequence diagrams'
      ],
      outputFormat: 'JSON with protocol design'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'messageFormats', 'artifacts'],
      properties: {
        protocols: { type: 'array', items: { type: 'object' } },
        messageFormats: { type: 'object' },
        handshaking: { type: 'object' },
        errorHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'protocols']
}));

export const architectureOptimizationTask = defineTask('architecture-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Architecture Optimization - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Architect',
      task: 'Optimize system architecture',
      context: args,
      instructions: [
        '1. Analyze data flow',
        '2. Optimize for performance',
        '3. Optimize for power',
        '4. Reduce latency',
        '5. Minimize resource usage',
        '6. Balance workload',
        '7. Consider parallelism',
        '8. Evaluate accelerators',
        '9. Document optimizations',
        '10. Create architecture diagram'
      ],
      outputFormat: 'JSON with optimized architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'optimizations', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'object' } },
        performanceEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'architecture']
}));

export const tradeoffAnalysisTask = defineTask('tradeoff-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Tradeoff Analysis - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Systems Architect',
      task: 'Analyze design tradeoffs',
      context: args,
      instructions: [
        '1. Identify tradeoffs',
        '2. Analyze performance vs power',
        '3. Analyze flexibility vs performance',
        '4. Evaluate cost impact',
        '5. Consider time-to-market',
        '6. Assess risk factors',
        '7. Document alternatives',
        '8. Make recommendations',
        '9. Justify decisions',
        '10. Create decision matrix'
      ],
      outputFormat: 'JSON with tradeoff analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['tradeoffs', 'recommendations', 'artifacts'],
      properties: {
        tradeoffs: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        decisionMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'tradeoffs']
}));

export const codesignDocumentationTask = defineTask('codesign-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate co-design documentation',
      context: args,
      instructions: [
        '1. Create overview document',
        '2. Document partitioning decisions',
        '3. Include interface specifications',
        '4. Document protocols',
        '5. Add architecture diagrams',
        '6. Include tradeoff analysis',
        '7. Create implementation guide',
        '8. Add verification plan',
        '9. Include glossary',
        '10. Format final document'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'artifacts'],
      properties: {
        specPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'codesign', 'documentation']
}));
