/**
 * @process specializations/domains/business/logistics/multi-channel-fulfillment
 * @description Integrated fulfillment strategy for omnichannel operations including ship-from-store, BOPIS, and unified inventory allocation.
 * @inputs { orders: array, channels: array, inventoryPools: array, fulfillmentRules?: array }
 * @outputs { success: boolean, fulfillmentPlan: array, channelAllocation: object, inventoryUtilization: object, customerExperience: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/multi-channel-fulfillment', {
 *   orders: [{ id: 'O001', channel: 'ecommerce', items: [{ sku: 'SKU001', qty: 1 }] }],
 *   channels: ['ecommerce', 'retail', 'marketplace'],
 *   inventoryPools: [{ id: 'DC1', type: 'distribution-center' }, { id: 'S001', type: 'store' }]
 * });
 *
 * @references
 * - RILA Retail Industry: https://www.rila.org/
 * - Omnichannel Fulfillment: https://www.supplychaindive.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    orders = [],
    channels = [],
    inventoryPools = [],
    fulfillmentRules = [],
    outputDir = 'multi-channel-fulfillment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Multi-Channel Fulfillment Process');
  ctx.log('info', `Orders: ${orders.length}, Channels: ${channels.length}, Inventory Pools: ${inventoryPools.length}`);

  // PHASE 1: ORDER CHANNEL ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing order channels');
  const channelAnalysis = await ctx.task(channelAnalysisTask, { orders, channels, outputDir });
  artifacts.push(...channelAnalysis.artifacts);

  // PHASE 2: UNIFIED INVENTORY VISIBILITY
  ctx.log('info', 'Phase 2: Establishing unified inventory visibility');
  const inventoryVisibility = await ctx.task(unifiedInventoryTask, { inventoryPools, outputDir });
  artifacts.push(...inventoryVisibility.artifacts);

  // PHASE 3: FULFILLMENT OPTION DETERMINATION
  ctx.log('info', 'Phase 3: Determining fulfillment options');
  const fulfillmentOptions = await ctx.task(fulfillmentOptionsTask, { orders, inventoryVisibility, fulfillmentRules, outputDir });
  artifacts.push(...fulfillmentOptions.artifacts);

  // PHASE 4: OPTIMAL SOURCING DECISION
  ctx.log('info', 'Phase 4: Making optimal sourcing decisions');
  const sourcingDecision = await ctx.task(optimalSourcingTask, { fulfillmentOptions: fulfillmentOptions.options, inventoryPools, outputDir });
  artifacts.push(...sourcingDecision.artifacts);

  // Quality Gate: Review fulfillment allocation
  await ctx.breakpoint({
    question: `Fulfillment allocation complete. DC fulfillment: ${sourcingDecision.dcFulfillment}%, Store fulfillment: ${sourcingDecision.storeFulfillment}%. Review allocation?`,
    title: 'Fulfillment Allocation Review',
    context: {
      runId: ctx.runId,
      summary: { dcFulfillment: sourcingDecision.dcFulfillment, storeFulfillment: sourcingDecision.storeFulfillment },
      files: sourcingDecision.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: BOPIS ORCHESTRATION
  ctx.log('info', 'Phase 5: Orchestrating BOPIS orders');
  const bopisOrchestration = await ctx.task(bopisOrchestrationTask, { bopisOrders: sourcingDecision.bopisOrders, outputDir });
  artifacts.push(...bopisOrchestration.artifacts);

  // PHASE 6: SHIP-FROM-STORE COORDINATION
  ctx.log('info', 'Phase 6: Coordinating ship-from-store');
  const shipFromStore = await ctx.task(shipFromStoreTask, { sfsOrders: sourcingDecision.sfsOrders, outputDir });
  artifacts.push(...shipFromStore.artifacts);

  // PHASE 7: SPLIT SHIPMENT MANAGEMENT
  ctx.log('info', 'Phase 7: Managing split shipments');
  const splitShipments = await ctx.task(splitShipmentTask, { orders, sourcingDecision, outputDir });
  artifacts.push(...splitShipments.artifacts);

  // PHASE 8: CUSTOMER COMMUNICATION
  ctx.log('info', 'Phase 8: Managing customer communication');
  const customerCommunication = await ctx.task(omniChannelCommunicationTask, { fulfillmentPlan: sourcingDecision.plan, outputDir });
  artifacts.push(...customerCommunication.artifacts);

  // PHASE 9: PERFORMANCE ANALYTICS
  ctx.log('info', 'Phase 9: Generating performance analytics');
  const performanceAnalytics = await ctx.task(omniChannelAnalyticsTask, { sourcingDecision, channelAnalysis, outputDir });
  artifacts.push(...performanceAnalytics.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Multi-channel fulfillment complete. ${orders.length} orders processed. Customer promise met: ${performanceAnalytics.promiseRate}%. Finalize?`,
    title: 'Multi-Channel Fulfillment Complete',
    context: {
      runId: ctx.runId,
      summary: {
        ordersProcessed: orders.length,
        dcFulfillment: `${sourcingDecision.dcFulfillment}%`,
        storeFulfillment: `${sourcingDecision.storeFulfillment}%`,
        promiseRate: `${performanceAnalytics.promiseRate}%`
      },
      files: [{ path: performanceAnalytics.reportPath, format: 'markdown', label: 'Performance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    fulfillmentPlan: sourcingDecision.plan,
    channelAllocation: channelAnalysis.allocation,
    inventoryUtilization: inventoryVisibility.utilization,
    customerExperience: { promiseRate: performanceAnalytics.promiseRate, deliverySpeed: performanceAnalytics.avgDeliveryTime },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/multi-channel-fulfillment', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const channelAnalysisTask = defineTask('channel-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze order channels', agent: { name: 'channel-analyst', prompt: { role: 'Channel Analysis Specialist', task: 'Analyze orders by fulfillment channel', context: args, instructions: ['Categorize by channel', 'Identify fulfillment requirements', 'Analyze channel mix', 'Determine priority', 'Calculate channel metrics', 'Generate channel report'] }, outputSchema: { type: 'object', required: ['analysis', 'allocation', 'artifacts'], properties: { analysis: { type: 'object' }, allocation: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'channel-analysis']
}));

export const unifiedInventoryTask = defineTask('unified-inventory', (args, taskCtx) => ({
  kind: 'agent', title: 'Establish unified inventory visibility', agent: { name: 'inventory-visibility-specialist', prompt: { role: 'Unified Inventory Specialist', task: 'Create unified view of inventory across all pools', context: args, instructions: ['Aggregate inventory pools', 'Calculate available-to-promise', 'Apply allocation rules', 'Identify constraints', 'Generate inventory view', 'Calculate utilization'] }, outputSchema: { type: 'object', required: ['unifiedView', 'utilization', 'artifacts'], properties: { unifiedView: { type: 'object' }, utilization: { type: 'object' }, atp: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'inventory']
}));

export const fulfillmentOptionsTask = defineTask('fulfillment-options', (args, taskCtx) => ({
  kind: 'agent', title: 'Determine fulfillment options', agent: { name: 'fulfillment-options-specialist', prompt: { role: 'Fulfillment Options Specialist', task: 'Determine available fulfillment options for each order', context: args, instructions: ['Evaluate DC fulfillment', 'Evaluate store fulfillment', 'Check BOPIS eligibility', 'Assess ship-from-store', 'Calculate delivery promises', 'Generate options matrix'] }, outputSchema: { type: 'object', required: ['options', 'artifacts'], properties: { options: { type: 'array' }, optionsMatrix: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'fulfillment-options']
}));

export const optimalSourcingTask = defineTask('optimal-sourcing', (args, taskCtx) => ({
  kind: 'agent', title: 'Make optimal sourcing decisions', agent: { name: 'sourcing-optimizer', prompt: { role: 'Sourcing Optimization Specialist', task: 'Optimize fulfillment sourcing decisions', context: args, instructions: ['Apply sourcing rules', 'Minimize cost-to-serve', 'Maximize service levels', 'Balance inventory', 'Allocate to sources', 'Generate fulfillment plan'] }, outputSchema: { type: 'object', required: ['plan', 'dcFulfillment', 'storeFulfillment', 'bopisOrders', 'sfsOrders', 'artifacts'], properties: { plan: { type: 'array' }, dcFulfillment: { type: 'number' }, storeFulfillment: { type: 'number' }, bopisOrders: { type: 'array' }, sfsOrders: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'sourcing']
}));

export const bopisOrchestrationTask = defineTask('bopis-orchestration', (args, taskCtx) => ({
  kind: 'agent', title: 'Orchestrate BOPIS orders', agent: { name: 'bopis-orchestrator', prompt: { role: 'BOPIS Orchestration Specialist', task: 'Orchestrate buy-online-pickup-in-store orders', context: args, instructions: ['Assign to stores', 'Set pickup windows', 'Notify store staff', 'Generate pick tasks', 'Send customer notifications', 'Track readiness'] }, outputSchema: { type: 'object', required: ['bopisPlan', 'artifacts'], properties: { bopisPlan: { type: 'array' }, pickupSchedule: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'bopis']
}));

export const shipFromStoreTask = defineTask('ship-from-store', (args, taskCtx) => ({
  kind: 'agent', title: 'Coordinate ship-from-store', agent: { name: 'ship-from-store-coordinator', prompt: { role: 'Ship-From-Store Coordinator', task: 'Coordinate ship-from-store fulfillment', context: args, instructions: ['Assign to stores', 'Generate pick lists', 'Arrange carrier pickup', 'Generate labels', 'Track store performance', 'Generate SFS plan'] }, outputSchema: { type: 'object', required: ['sfsPlan', 'artifacts'], properties: { sfsPlan: { type: 'array' }, storeAssignments: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'ship-from-store']
}));

export const splitShipmentTask = defineTask('split-shipment', (args, taskCtx) => ({
  kind: 'agent', title: 'Manage split shipments', agent: { name: 'split-shipment-manager', prompt: { role: 'Split Shipment Manager', task: 'Manage orders requiring split shipments', context: args, instructions: ['Identify split shipments', 'Coordinate multiple sources', 'Manage customer expectations', 'Track partial deliveries', 'Optimize split decisions', 'Generate split plan'] }, outputSchema: { type: 'object', required: ['splitPlan', 'artifacts'], properties: { splitPlan: { type: 'array' }, splitOrders: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'split-shipment']
}));

export const omniChannelCommunicationTask = defineTask('omni-channel-communication', (args, taskCtx) => ({
  kind: 'agent', title: 'Manage customer communication', agent: { name: 'omni-channel-communication-specialist', prompt: { role: 'Omni-Channel Communication Specialist', task: 'Manage customer communications across channels', context: args, instructions: ['Generate order confirmations', 'Send fulfillment updates', 'Provide tracking info', 'Handle pickup ready notifications', 'Manage delivery exceptions', 'Generate communication plan'] }, outputSchema: { type: 'object', required: ['communicationPlan', 'artifacts'], properties: { communicationPlan: { type: 'array' }, notifications: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'communication']
}));

export const omniChannelAnalyticsTask = defineTask('omni-channel-analytics', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate performance analytics', agent: { name: 'omni-channel-analytics-specialist', prompt: { role: 'Omni-Channel Analytics Specialist', task: 'Generate multi-channel fulfillment analytics', context: args, instructions: ['Calculate promise rate', 'Measure delivery speed', 'Analyze channel performance', 'Track cost-to-serve', 'Identify improvements', 'Generate analytics report'] }, outputSchema: { type: 'object', required: ['promiseRate', 'avgDeliveryTime', 'reportPath', 'artifacts'], properties: { promiseRate: { type: 'number' }, avgDeliveryTime: { type: 'number' }, metrics: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'multi-channel', 'analytics']
}));
