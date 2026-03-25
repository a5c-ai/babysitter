/**
 * @process specializations/fpga-programming/clock-network-design
 * @description Clock Network Design and Constraints - Design clock distribution networks using global and regional
 * clock resources. Define clock relationships and constraints for derived clocks and PLLs/MMCMs.
 * @inputs { designName: string, clockRequirements: array, targetDevice: string, pllConfiguration?: object, outputDir?: string }
 * @outputs { success: boolean, clockNetwork: object, pllDesign: object, constraintFile: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/clock-network-design', {
 *   designName: 'video_interface',
 *   clockRequirements: [{ name: 'pixel_clk', frequency: 148.5 }, { name: 'ddr_clk', frequency: 400 }],
 *   targetDevice: 'Xilinx Artix-7 XC7A100T',
 *   pllConfiguration: { type: 'MMCM', inputFrequency: 100 }
 * });
 *
 * @references
 * - Xilinx Clocking Resources: https://docs.amd.com/r/en-US/ug472_7Series_Clocking
 * - Intel Clock Networks: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    clockRequirements,
    targetDevice,
    pllConfiguration = null,
    clockBufferStrategy = 'auto',
    outputDir = 'clock-network-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Clock Network Design for: ${designName}`);
  ctx.log('info', `Target: ${targetDevice}, Clocks: ${clockRequirements.length}`);

  const clockArchitecture = await ctx.task(clockArchitectureTask, { designName, clockRequirements, targetDevice, outputDir });
  artifacts.push(...clockArchitecture.artifacts);

  const pllMmcmDesign = await ctx.task(pllMmcmDesignTask, { designName, clockRequirements, pllConfiguration, targetDevice, outputDir });
  artifacts.push(...pllMmcmDesign.artifacts);

  const clockDistribution = await ctx.task(clockDistributionTask, { designName, clockArchitecture, pllMmcmDesign, clockBufferStrategy, outputDir });
  artifacts.push(...clockDistribution.artifacts);

  await ctx.breakpoint({
    question: `Clock network designed for ${designName}. ${pllMmcmDesign.outputClocks} PLL outputs, ${clockDistribution.bufferCount} clock buffers. Review clock design?`,
    title: 'Clock Network Review',
    context: { runId: ctx.runId, designName, pllOutputs: pllMmcmDesign.outputClocks, buffers: clockDistribution.bufferCount }
  });

  const clockConstraints = await ctx.task(clockConstraintsNetworkTask, { designName, clockArchitecture, pllMmcmDesign, clockDistribution, outputDir });
  artifacts.push(...clockConstraints.artifacts);

  const clockVerification = await ctx.task(clockVerificationTask, { designName, clockArchitecture, pllMmcmDesign, clockDistribution, outputDir });
  artifacts.push(...clockVerification.artifacts);

  const endTime = ctx.now();

  return {
    success: clockVerification.passed,
    designName,
    clockNetwork: { architecture: clockArchitecture.architecture, distribution: clockDistribution.network },
    pllDesign: pllMmcmDesign.design,
    constraintFile: clockConstraints.constraintFilePath,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/clock-network-design', timestamp: startTime, designName, outputDir }
  };
}

export const clockArchitectureTask = defineTask('clock-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock Architecture - ${args.designName}`,
  agent: {
    name: 'clock-engineer',
    prompt: {
      role: 'FPGA Clock Engineer',
      task: 'Design clock architecture',
      context: args,
      instructions: ['1. Analyze clock requirements', '2. Identify clock sources', '3. Plan clock tree', '4. Select PLL/MMCM resources', '5. Plan clock regions', '6. Design clock enables', '7. Handle derived clocks', '8. Document clock relationships', '9. Create clock diagram', '10. Specify jitter budget']
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: { architecture: { type: 'object' }, clockSources: { type: 'array', items: { type: 'object' } }, clockTree: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'clock', 'architecture']
}));

export const pllMmcmDesignTask = defineTask('pll-mmcm-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `PLL/MMCM Design - ${args.designName}`,
  agent: {
    name: 'clock-engineer',
    prompt: {
      role: 'FPGA Clock Engineer',
      task: 'Design PLL/MMCM configuration',
      context: args,
      instructions: ['1. Calculate VCO frequency', '2. Determine multiplier/divider', '3. Configure output clocks', '4. Set phase relationships', '5. Configure feedback path', '6. Design lock detection', '7. Handle dynamic reconfiguration', '8. Document configuration', '9. Instantiate PLL/MMCM', '10. Verify frequency accuracy']
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'outputClocks', 'artifacts'],
      properties: { design: { type: 'object' }, outputClocks: { type: 'number' }, configuration: { type: 'object' }, instantiationPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'clock', 'pll', 'mmcm']
}));

export const clockDistributionTask = defineTask('clock-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock Distribution - ${args.designName}`,
  agent: {
    name: 'clock-engineer',
    prompt: {
      role: 'FPGA Clock Engineer',
      task: 'Design clock distribution',
      context: args,
      instructions: ['1. Select clock buffers (BUFG, BUFR, BUFH)', '2. Plan global vs regional distribution', '3. Design clock gating cells', '4. Handle clock enables', '5. Minimize skew', '6. Balance clock loads', '7. Document distribution', '8. Create buffer instantiation', '9. Verify coverage', '10. Test distribution']
    },
    outputSchema: {
      type: 'object',
      required: ['network', 'bufferCount', 'artifacts'],
      properties: { network: { type: 'object' }, bufferCount: { type: 'number' }, buffers: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'clock', 'distribution']
}));

export const clockConstraintsNetworkTask = defineTask('clock-constraints-network', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock Constraints - ${args.designName}`,
  agent: {
    name: 'timing-engineer',
    prompt: {
      role: 'FPGA Timing Engineer',
      task: 'Create clock network constraints',
      context: args,
      instructions: ['1. Define primary clocks', '2. Define generated clocks', '3. Set clock groups', '4. Specify clock uncertainty', '5. Add clock latency', '6. Constrain clock buffers', '7. Document constraints', '8. Validate completeness', '9. Test constraints', '10. Generate constraint file']
    },
    outputSchema: {
      type: 'object',
      required: ['constraintFilePath', 'artifacts'],
      properties: { constraintFilePath: { type: 'string' }, clockDefinitions: { type: 'array', items: { type: 'object' } }, clockGroups: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'clock', 'constraints']
}));

export const clockVerificationTask = defineTask('clock-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clock Verification - ${args.designName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Verify clock network',
      context: args,
      instructions: ['1. Verify PLL lock', '2. Check output frequencies', '3. Verify phase relationships', '4. Test clock enables', '5. Check clock gating', '6. Verify distribution', '7. Measure jitter', '8. Test dynamic reconfig', '9. Document verification', '10. Generate report']
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: { passed: { type: 'boolean' }, frequencyResults: { type: 'array', items: { type: 'object' } }, issues: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'clock', 'verification']
}));
