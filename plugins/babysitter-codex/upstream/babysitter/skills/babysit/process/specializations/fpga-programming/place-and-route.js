/**
 * @process specializations/fpga-programming/place-and-route
 * @description Place and Route Optimization - Optimize placement and routing to achieve timing closure and minimize
 * resource utilization. Use floorplanning, placement constraints, and routing directives.
 * @inputs { designName: string, targetDevice: string, targetFrequency?: number, floorplanStrategy?: string, outputDir?: string }
 * @outputs { success: boolean, implementationReport: object, resourceUtilization: object, timingResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/place-and-route', {
 *   designName: 'image_processor',
 *   targetDevice: 'Intel Agilex AGFB014R24B',
 *   targetFrequency: 400,
 *   floorplanStrategy: 'hierarchical'
 * });
 *
 * @references
 * - Vivado Implementation: https://docs.amd.com/r/en-US/ug904-vivado-implementation
 * - Quartus Fitter: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    targetDevice,
    targetFrequency = 200,
    floorplanStrategy = 'auto',
    congestionOptimization = true,
    outputDir = 'pnr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Place and Route for: ${designName}`);
  ctx.log('info', `Target: ${targetDevice}, Frequency: ${targetFrequency}MHz`);

  const floorplanning = await ctx.task(floorplanningTask, { designName, targetDevice, floorplanStrategy, outputDir });
  artifacts.push(...floorplanning.artifacts);

  const placementOptimization = await ctx.task(placementOptimizationTask, { designName, targetDevice, floorplanning, targetFrequency, outputDir });
  artifacts.push(...placementOptimization.artifacts);

  const routingOptimization = await ctx.task(routingOptimizationTask, { designName, placementOptimization, congestionOptimization, outputDir });
  artifacts.push(...routingOptimization.artifacts);

  await ctx.breakpoint({
    question: `Place and route complete for ${designName}. Utilization: ${placementOptimization.utilization}%, Timing: ${routingOptimization.timingMet ? 'MET' : 'FAILED'}. Review results?`,
    title: 'Place and Route Review',
    context: { runId: ctx.runId, designName, utilization: placementOptimization.utilization, timingMet: routingOptimization.timingMet }
  });

  const postRouteOptimization = await ctx.task(postRouteOptimizationTask, { designName, routingOptimization, targetFrequency, outputDir });
  artifacts.push(...postRouteOptimization.artifacts);

  const bitstreamGeneration = await ctx.task(bitstreamGenerationTask, { designName, postRouteOptimization, targetDevice, outputDir });
  artifacts.push(...bitstreamGeneration.artifacts);

  const endTime = ctx.now();

  return {
    success: postRouteOptimization.timingMet,
    designName,
    implementationReport: { device: targetDevice, strategy: floorplanStrategy, bitstreamPath: bitstreamGeneration.bitstreamPath },
    resourceUtilization: placementOptimization.resourceUtilization,
    timingResults: { targetFrequency, worstSlack: postRouteOptimization.worstSlack, timingMet: postRouteOptimization.timingMet },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/fpga-programming/place-and-route', timestamp: startTime, designName, outputDir }
  };
}

export const floorplanningTask = defineTask('floorplanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Floorplanning - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Create design floorplan',
      context: args,
      instructions: ['1. Analyze design hierarchy', '2. Identify critical modules', '3. Create placement regions (PBLOCKs)', '4. Assign modules to regions', '5. Define IO placement', '6. Consider clock regions', '7. Plan for congestion', '8. Document floorplan', '9. Validate floorplan', '10. Create floorplan constraints']
    },
    outputSchema: {
      type: 'object',
      required: ['floorplanPath', 'artifacts'],
      properties: { floorplanPath: { type: 'string' }, regions: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'pnr', 'floorplan']
}));

export const placementOptimizationTask = defineTask('placement-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Placement Optimization - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Optimize placement',
      context: args,
      instructions: ['1. Run initial placement', '2. Analyze placement quality', '3. Apply placement constraints', '4. Optimize for timing', '5. Reduce wire length', '6. Balance utilization', '7. Avoid congestion', '8. Lock critical placement', '9. Document placement', '10. Generate placement report']
    },
    outputSchema: {
      type: 'object',
      required: ['utilization', 'resourceUtilization', 'artifacts'],
      properties: { utilization: { type: 'string' }, resourceUtilization: { type: 'object' }, placementScore: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'pnr', 'placement']
}));

export const routingOptimizationTask = defineTask('routing-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Routing Optimization - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Optimize routing',
      context: args,
      instructions: ['1. Run initial routing', '2. Analyze routing congestion', '3. Apply routing directives', '4. Optimize critical nets', '5. Resolve congestion', '6. Check for shorts', '7. Optimize timing', '8. Document routing', '9. Validate routing', '10. Generate routing report']
    },
    outputSchema: {
      type: 'object',
      required: ['timingMet', 'congestionLevel', 'artifacts'],
      properties: { timingMet: { type: 'boolean' }, congestionLevel: { type: 'string' }, routedNets: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'pnr', 'routing']
}));

export const postRouteOptimizationTask = defineTask('post-route-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Route Optimization - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Apply post-route optimizations',
      context: args,
      instructions: ['1. Run post-route timing', '2. Apply physical optimization', '3. Reroute critical paths', '4. Optimize hold timing', '5. Apply post-route phys_opt', '6. Verify timing closure', '7. Check DRC', '8. Document optimizations', '9. Validate design', '10. Generate final report']
    },
    outputSchema: {
      type: 'object',
      required: ['timingMet', 'worstSlack', 'artifacts'],
      properties: { timingMet: { type: 'boolean' }, worstSlack: { type: 'number' }, optimizationsApplied: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'pnr', 'post-route']
}));

export const bitstreamGenerationTask = defineTask('bitstream-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bitstream Generation - ${args.designName}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'FPGA Implementation Engineer',
      task: 'Generate bitstream',
      context: args,
      instructions: ['1. Configure bitstream options', '2. Set security options', '3. Configure startup options', '4. Run DRC checks', '5. Generate bitstream', '6. Generate debug probes', '7. Create programming files', '8. Document bitstream', '9. Archive outputs', '10. Generate summary']
    },
    outputSchema: {
      type: 'object',
      required: ['bitstreamPath', 'artifacts'],
      properties: { bitstreamPath: { type: 'string' }, programmingFiles: { type: 'array', items: { type: 'string' } }, debugProbesPath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['fpga', 'pnr', 'bitstream']
}));
