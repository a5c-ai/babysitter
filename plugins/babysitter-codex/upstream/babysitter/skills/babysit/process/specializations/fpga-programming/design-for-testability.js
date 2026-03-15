/**
 * @process specializations/fpga-programming/design-for-testability
 * @description Design for Testability (DFT) - Implement JTAG boundary scan, BIST (Built-In Self Test), and production
 * test infrastructure. Enable efficient manufacturing test and field diagnostics.
 * @inputs { designName: string, testStrategy: string, jtagSupport?: boolean, bistModules?: array, outputDir?: string }
 * @outputs { success: boolean, dftDesign: object, testInfrastructure: object, coverageReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/design-for-testability', {
 *   designName: 'network_processor',
 *   testStrategy: 'comprehensive',
 *   jtagSupport: true,
 *   bistModules: ['memory_bist', 'logic_bist']
 * });
 *
 * @references
 * - IEEE 1149.1 JTAG: https://standards.ieee.org/standard/1149_1-2013.html
 * - IEEE 1500 Embedded Core Test: https://standards.ieee.org/standard/1500-2005.html
 * - FPGA BIST Techniques: https://docs.amd.com/r/en-US/ug908-vivado-programming-debugging
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    testStrategy,
    jtagSupport = true,
    bistModules = [],
    scanChainInsertion = true,
    outputDir = 'dft-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting DFT Design for: ${designName}`);
  ctx.log('info', `Strategy: ${testStrategy}, JTAG: ${jtagSupport}, BIST: ${bistModules.length} modules`);

  const dftPlanning = await ctx.task(dftPlanningTask, { designName, testStrategy, jtagSupport, bistModules, outputDir });
  artifacts.push(...dftPlanning.artifacts);

  const jtagImplementation = jtagSupport ? await ctx.task(jtagImplementationTask, { designName, dftPlanning, outputDir }) : null;
  if (jtagImplementation) artifacts.push(...jtagImplementation.artifacts);

  const bistImplementation = bistModules.length > 0 ? await ctx.task(bistImplementationTask, { designName, bistModules, outputDir }) : null;
  if (bistImplementation) artifacts.push(...bistImplementation.artifacts);

  await ctx.breakpoint({
    question: `DFT infrastructure designed for ${designName}. JTAG: ${jtagSupport ? 'Yes' : 'No'}, BIST: ${bistModules.length} modules. Review DFT design?`,
    title: 'DFT Design Review',
    context: { runId: ctx.runId, designName, jtagSupport, bistCount: bistModules.length }
  });

  const scanChainDesign = scanChainInsertion ? await ctx.task(scanChainDesignTask, { designName, dftPlanning, outputDir }) : null;
  if (scanChainDesign) artifacts.push(...scanChainDesign.artifacts);

  const testPatternGeneration = await ctx.task(testPatternGenerationTask, { designName, dftPlanning, jtagImplementation, bistImplementation, outputDir });
  artifacts.push(...testPatternGeneration.artifacts);

  const coverageAnalysis = await ctx.task(coverageAnalysisTask, { designName, testPatternGeneration, outputDir });
  artifacts.push(...coverageAnalysis.artifacts);

  const dftVerification = await ctx.task(dftVerificationTask, { designName, jtagImplementation, bistImplementation, scanChainDesign, testPatternGeneration, outputDir });
  artifacts.push(...dftVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: dftVerification.passed,
    designName,
    dftDesign: { strategy: testStrategy, jtagEnabled: jtagSupport, bistModules: bistModules },
    testInfrastructure: { jtag: jtagImplementation?.infrastructure, bist: bistImplementation?.modules, scanChains: scanChainDesign?.chains },
    coverageReport: coverageAnalysis.report,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/design-for-testability', timestamp: startTime, designName, outputDir }
  };
}

export const dftPlanningTask = defineTask('dft-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `DFT Planning - ${args.designName}`,
  agent: {
    name: 'dft-engineer',
    prompt: {
      role: 'DFT Design Engineer',
      task: 'Plan DFT strategy',
      context: args,
      instructions: ['1. Analyze testability requirements', '2. Define test access mechanisms', '3. Plan JTAG architecture', '4. Plan BIST strategy', '5. Define scan chain requirements', '6. Identify test points', '7. Plan test modes', '8. Document DFT plan', '9. Estimate coverage goals', '10. Get plan approval']
    },
    outputSchema: {
      type: 'object',
      required: ['dftPlan', 'artifacts'],
      properties: { dftPlan: { type: 'object' }, testAccessMechanisms: { type: 'array', items: { type: 'string' } }, coverageGoals: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'planning']
}));

export const jtagImplementationTask = defineTask('jtag-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `JTAG Implementation - ${args.designName}`,
  agent: {
    name: 'dft-engineer',
    prompt: {
      role: 'DFT Design Engineer',
      task: 'Implement JTAG interface',
      context: args,
      instructions: ['1. Design TAP controller', '2. Implement instruction register', '3. Design boundary scan cells', '4. Implement bypass register', '5. Add IDCODE register', '6. Implement user registers', '7. Connect JTAG chain', '8. Document JTAG interface', '9. Create BSDL file', '10. Verify JTAG operation']
    },
    outputSchema: {
      type: 'object',
      required: ['infrastructure', 'artifacts'],
      properties: { infrastructure: { type: 'object' }, tapController: { type: 'object' }, bsdlFilePath: { type: 'string' }, chainLength: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'jtag']
}));

export const bistImplementationTask = defineTask('bist-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `BIST Implementation - ${args.designName}`,
  agent: {
    name: 'dft-engineer',
    prompt: {
      role: 'DFT Design Engineer',
      task: 'Implement BIST modules',
      context: args,
      instructions: ['1. Design memory BIST controller', '2. Implement march algorithms', '3. Design logic BIST', '4. Implement PRPG/MISR', '5. Add BIST control registers', '6. Design fault injection', '7. Implement result reporting', '8. Document BIST operation', '9. Test BIST modules', '10. Verify fault detection']
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'artifacts'],
      properties: { modules: { type: 'array', items: { type: 'object' } }, memoryBistCount: { type: 'number' }, logicBistCount: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'bist']
}));

export const scanChainDesignTask = defineTask('scan-chain-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan Chain Design - ${args.designName}`,
  agent: {
    name: 'dft-engineer',
    prompt: {
      role: 'DFT Design Engineer',
      task: 'Design scan chains',
      context: args,
      instructions: ['1. Identify scan candidates', '2. Insert scan flip-flops', '3. Balance chain lengths', '4. Design scan compression', '5. Handle clock domains', '6. Add scan enable logic', '7. Document scan architecture', '8. Generate scan constraints', '9. Test scan operation', '10. Verify chain connectivity']
    },
    outputSchema: {
      type: 'object',
      required: ['chains', 'artifacts'],
      properties: { chains: { type: 'array', items: { type: 'object' } }, chainCount: { type: 'number' }, totalFlops: { type: 'number' }, compressionRatio: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'scan']
}));

export const testPatternGenerationTask = defineTask('test-pattern-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Pattern Generation - ${args.designName}`,
  agent: {
    name: 'dft-engineer',
    prompt: {
      role: 'DFT Design Engineer',
      task: 'Generate test patterns',
      context: args,
      instructions: ['1. Generate ATPG patterns', '2. Generate BIST sequences', '3. Create boundary scan patterns', '4. Design functional tests', '5. Add diagnostic patterns', '6. Optimize pattern count', '7. Document test procedures', '8. Generate test vectors', '9. Validate patterns', '10. Export for ATE']
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: { patterns: { type: 'object' }, patternCount: { type: 'number' }, vectorFilePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'patterns']
}));

export const coverageAnalysisTask = defineTask('coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coverage Analysis - ${args.designName}`,
  agent: {
    name: 'dft-engineer',
    prompt: {
      role: 'DFT Design Engineer',
      task: 'Analyze test coverage',
      context: args,
      instructions: ['1. Run fault simulation', '2. Calculate stuck-at coverage', '3. Calculate transition coverage', '4. Analyze BIST coverage', '5. Identify uncovered faults', '6. Analyze coverage gaps', '7. Plan coverage improvement', '8. Document coverage', '9. Generate coverage report', '10. Review with team']
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: { report: { type: 'object' }, stuckAtCoverage: { type: 'number' }, transitionCoverage: { type: 'number' }, uncoveredFaults: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'coverage']
}));

export const dftVerificationTask = defineTask('dft-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `DFT Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'DFT Verification Engineer',
      task: 'Verify DFT implementation',
      context: args,
      instructions: ['1. Verify JTAG operation', '2. Test boundary scan', '3. Verify BIST execution', '4. Test scan chains', '5. Verify test modes', '6. Test pattern application', '7. Verify fault detection', '8. Check timing', '9. Document results', '10. Generate verification report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, jtagResults: { type: 'object' }, bistResults: { type: 'object' }, scanResults: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'dft', 'verification']
}));
