/**
 * @process specializations/domains/business/legal/data-mapping-inventory
 * @description Data Mapping and Inventory - Establish data processing activity mapping, data flow
 * documentation, and records of processing activities (ROPA).
 * @inputs { organizationProfile: object, scope?: array, outputDir?: string }
 * @outputs { success: boolean, dataInventory: object, dataFlows: array, ropa: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/data-mapping-inventory', {
 *   organizationProfile: { name: 'Acme Corp', departments: ['HR', 'Sales', 'Marketing', 'IT'] },
 *   scope: ['personal-data', 'sensitive-data'],
 *   outputDir: 'data-mapping'
 * });
 *
 * @references
 * - NIST Privacy Framework: https://www.nist.gov/privacy-framework
 * - ISO 27701: https://www.iso.org/standard/71670.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    scope = ['personal-data'],
    outputDir = 'data-mapping-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Data Mapping for ${organizationProfile.name}`);

  // Phase 1: Data Discovery
  const dataDiscovery = await ctx.task(dataDiscoveryTask, {
    organizationProfile,
    scope,
    outputDir
  });
  artifacts.push(...dataDiscovery.artifacts);

  // Phase 2: Data Classification
  const dataClassification = await ctx.task(dataClassificationTask, {
    discoveredData: dataDiscovery.data,
    outputDir
  });
  artifacts.push(...dataClassification.artifacts);

  // Phase 3: Data Flow Mapping
  const dataFlowMapping = await ctx.task(dataFlowMappingTask, {
    classifiedData: dataClassification.classifiedData,
    organizationProfile,
    outputDir
  });
  artifacts.push(...dataFlowMapping.artifacts);

  // Phase 4: System Inventory
  const systemInventory = await ctx.task(systemInventoryTask, {
    dataFlows: dataFlowMapping.flows,
    outputDir
  });
  artifacts.push(...systemInventory.artifacts);

  // Phase 5: Third Party Mapping
  const thirdPartyMapping = await ctx.task(thirdPartyMappingTask, {
    dataFlows: dataFlowMapping.flows,
    outputDir
  });
  artifacts.push(...thirdPartyMapping.artifacts);

  // Phase 6: ROPA Generation
  const ropaGeneration = await ctx.task(ropaGenerationTask, {
    classifiedData: dataClassification.classifiedData,
    dataFlows: dataFlowMapping.flows,
    systems: systemInventory.systems,
    thirdParties: thirdPartyMapping.thirdParties,
    outputDir
  });
  artifacts.push(...ropaGeneration.artifacts);

  // Phase 7: Data Map Visualization
  const visualization = await ctx.task(dataMapVisualizationTask, {
    dataFlows: dataFlowMapping.flows,
    systems: systemInventory.systems,
    outputDir
  });
  artifacts.push(...visualization.artifacts);

  await ctx.breakpoint({
    question: `Data mapping for ${organizationProfile.name} complete. ${dataClassification.classifiedData.length} data elements, ${dataFlowMapping.flows.length} flows mapped. Review results?`,
    title: 'Data Mapping Review',
    context: {
      runId: ctx.runId,
      dataElementsCount: dataClassification.classifiedData.length,
      flowsCount: dataFlowMapping.flows.length,
      systemsCount: systemInventory.systems.length,
      files: [
        { path: ropaGeneration.ropaPath, format: 'xlsx', label: 'ROPA' },
        { path: visualization.mapPath, format: 'html', label: 'Data Flow Map' }
      ]
    }
  });

  return {
    success: true,
    organization: organizationProfile.name,
    dataInventory: {
      totalElements: dataClassification.classifiedData.length,
      byCategory: dataClassification.byCategory,
      systemsCount: systemInventory.systems.length
    },
    dataFlows: dataFlowMapping.flows,
    ropa: {
      path: ropaGeneration.ropaPath,
      activitiesCount: ropaGeneration.activitiesCount
    },
    visualization: visualization.mapPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/data-mapping-inventory', timestamp: startTime }
  };
}

export const dataDiscoveryTask = defineTask('data-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover data',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Data Discovery Specialist',
      task: 'Discover data across organization',
      context: args,
      instructions: ['Survey departments', 'Identify data sources', 'Catalog data types', 'Document data locations'],
      outputFormat: 'JSON with data array, sources, artifacts'
    },
    outputSchema: { type: 'object', required: ['data', 'artifacts'], properties: { data: { type: 'array' }, sources: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));

export const dataClassificationTask = defineTask('data-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify data',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Data Classification Specialist',
      task: 'Classify discovered data',
      context: args,
      instructions: ['Classify by sensitivity', 'Identify personal data', 'Identify special categories', 'Document classification'],
      outputFormat: 'JSON with classifiedData array, byCategory object, artifacts'
    },
    outputSchema: { type: 'object', required: ['classifiedData', 'artifacts'], properties: { classifiedData: { type: 'array' }, byCategory: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));

export const dataFlowMappingTask = defineTask('data-flow-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map data flows',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Data Flow Specialist',
      task: 'Map data flows',
      context: args,
      instructions: ['Track data movement', 'Document sources and destinations', 'Identify cross-border flows', 'Document flow purposes'],
      outputFormat: 'JSON with flows array, artifacts'
    },
    outputSchema: { type: 'object', required: ['flows', 'artifacts'], properties: { flows: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));

export const systemInventoryTask = defineTask('system-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory systems',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'System Inventory Specialist',
      task: 'Inventory data systems',
      context: args,
      instructions: ['Catalog all systems', 'Document data stored', 'Record access controls', 'Note security measures'],
      outputFormat: 'JSON with systems array, artifacts'
    },
    outputSchema: { type: 'object', required: ['systems', 'artifacts'], properties: { systems: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));

export const thirdPartyMappingTask = defineTask('third-party-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map third parties',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Third Party Mapping Specialist',
      task: 'Map third party data sharing',
      context: args,
      instructions: ['Identify all third parties', 'Document data shared', 'Record agreements', 'Assess third party risk'],
      outputFormat: 'JSON with thirdParties array, artifacts'
    },
    outputSchema: { type: 'object', required: ['thirdParties', 'artifacts'], properties: { thirdParties: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));

export const ropaGenerationTask = defineTask('ropa-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate ROPA',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'ROPA Generation Specialist',
      task: 'Generate Records of Processing Activities',
      context: args,
      instructions: ['Compile processing activities', 'Document all required fields', 'Format per GDPR Art 30', 'Export to spreadsheet'],
      outputFormat: 'JSON with ropaPath, activitiesCount, artifacts'
    },
    outputSchema: { type: 'object', required: ['ropaPath', 'activitiesCount', 'artifacts'], properties: { ropaPath: { type: 'string' }, activitiesCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));

export const dataMapVisualizationTask = defineTask('data-map-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Visualize data map',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Data Visualization Specialist',
      task: 'Create data flow visualization',
      context: args,
      instructions: ['Create visual data map', 'Show systems and flows', 'Highlight cross-border transfers', 'Generate interactive diagram'],
      outputFormat: 'JSON with mapPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['mapPath', 'artifacts'], properties: { mapPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'data-mapping']
}));
