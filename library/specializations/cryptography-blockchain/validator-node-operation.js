/**
 * @process specializations/cryptography-blockchain/validator-node-operation
 * @description Validator Node Operation - Setup and operation of proof-of-stake validator nodes with key management,
 * slashing protection, and MEV strategies.
 * @inputs { projectName: string, network: string, validatorCount?: number, mevStrategy?: string }
 * @outputs { success: boolean, validatorInfo: object, configuration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/validator-node-operation', {
 *   projectName: 'ETH Staking Operation',
 *   network: 'ethereum',
 *   validatorCount: 100,
 *   mevStrategy: 'mev-boost'
 * });
 *
 * @references
 * - Ethereum Staking: https://ethereum.org/staking/
 * - MEV-Boost: https://docs.flashbots.net/flashbots-mev-boost
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    network,
    validatorCount = 1,
    mevStrategy = 'vanilla',
    withdrawalAddress,
    features = ['slashing-protection', 'monitoring'],
    outputDir = 'validator-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Validator Node Operation: ${projectName}`);

  const stakingAnalysis = await ctx.task(stakingAnalysisTask, { projectName, network, validatorCount, outputDir });
  artifacts.push(...stakingAnalysis.artifacts);

  const keyManagement = await ctx.task(keyManagementTask, { projectName, validatorCount, outputDir });
  artifacts.push(...keyManagement.artifacts);

  const consensusClientSetup = await ctx.task(consensusClientSetupTask, { projectName, network, outputDir });
  artifacts.push(...consensusClientSetup.artifacts);

  const validatorClientSetup = await ctx.task(validatorClientSetupTask, { projectName, validatorCount, outputDir });
  artifacts.push(...validatorClientSetup.artifacts);

  const slashingProtection = await ctx.task(slashingProtectionTask, { projectName, features, outputDir });
  artifacts.push(...slashingProtection.artifacts);

  const mevConfiguration = await ctx.task(mevConfigurationTask, { projectName, mevStrategy, outputDir });
  artifacts.push(...mevConfiguration.artifacts);

  const monitoringAlerting = await ctx.task(monitoringAlertingTask, { projectName, validatorCount, outputDir });
  artifacts.push(...monitoringAlerting.artifacts);

  const operationalProcedures = await ctx.task(operationalProceduresTask, { projectName, outputDir });
  artifacts.push(...operationalProcedures.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    validatorInfo: { network, validatorCount, mevStrategy, withdrawalAddress },
    configuration: { consensus: consensusClientSetup, validator: validatorClientSetup },
    monitoring: monitoringAlerting,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/validator-node-operation', timestamp: startTime }
  };
}

export const stakingAnalysisTask = defineTask('staking-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Staking Analysis - ${args.projectName}`,
  agent: {
    name: 'staking-analyst',
    prompt: {
      role: 'Staking Operations Analyst',
      task: 'Analyze staking requirements',
      context: args,
      instructions: ['1. Analyze network economics', '2. Calculate expected returns', '3. Assess slashing risks', '4. Plan hardware requirements', '5. Evaluate MEV opportunities', '6. Plan capital allocation', '7. Assess regulatory requirements', '8. Plan exit strategy', '9. Document analysis', '10. Create financial model'],
      outputFormat: 'JSON with staking analysis'
    },
    outputSchema: { type: 'object', required: ['analysis', 'economics', 'artifacts'], properties: { analysis: { type: 'object' }, economics: { type: 'object' }, risks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'analysis']
}));

export const keyManagementTask = defineTask('key-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Key Management - ${args.projectName}`,
  agent: {
    name: 'key-manager',
    prompt: {
      role: 'Validator Key Manager',
      task: 'Setup validator key management',
      context: args,
      instructions: ['1. Generate validator keys', '2. Setup secure storage', '3. Implement key backup', '4. Configure withdrawal keys', '5. Setup signing keys', '6. Implement key rotation', '7. Add HSM support', '8. Setup recovery procedures', '9. Test key operations', '10. Document key management'],
      outputFormat: 'JSON with key management'
    },
    outputSchema: { type: 'object', required: ['keyManagement', 'securityMeasures', 'artifacts'], properties: { keyManagement: { type: 'object' }, securityMeasures: { type: 'array' }, backupProcedures: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'keys']
}));

export const consensusClientSetupTask = defineTask('consensus-client-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consensus Client Setup - ${args.projectName}`,
  agent: {
    name: 'consensus-engineer',
    prompt: {
      role: 'Consensus Client Engineer',
      task: 'Setup consensus client',
      context: args,
      instructions: ['1. Select consensus client', '2. Install and configure', '3. Setup beacon node', '4. Configure P2P network', '5. Setup checkpoint sync', '6. Configure MEV relay', '7. Setup execution client connection', '8. Configure APIs', '9. Test sync', '10. Document configuration'],
      outputFormat: 'JSON with consensus client setup'
    },
    outputSchema: { type: 'object', required: ['consensusConfig', 'syncStatus', 'artifacts'], properties: { consensusConfig: { type: 'object' }, syncStatus: { type: 'object' }, clientInfo: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'consensus']
}));

export const validatorClientSetupTask = defineTask('validator-client-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validator Client Setup - ${args.projectName}`,
  agent: {
    name: 'validator-engineer',
    prompt: {
      role: 'Validator Client Engineer',
      task: 'Setup validator client',
      context: args,
      instructions: ['1. Install validator client', '2. Import validator keys', '3. Configure fee recipient', '4. Setup slashing protection', '5. Configure graffiti', '6. Setup remote signing', '7. Configure redundancy', '8. Setup doppelganger protection', '9. Test attestations', '10. Document setup'],
      outputFormat: 'JSON with validator client setup'
    },
    outputSchema: { type: 'object', required: ['validatorConfig', 'validatorCount', 'artifacts'], properties: { validatorConfig: { type: 'object' }, validatorCount: { type: 'number' }, feeRecipient: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'client']
}));

export const slashingProtectionTask = defineTask('slashing-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Slashing Protection - ${args.projectName}`,
  agent: {
    name: 'slashing-engineer',
    prompt: {
      role: 'Slashing Protection Engineer',
      task: 'Implement slashing protection',
      context: args,
      instructions: ['1. Configure slashing DB', '2. Setup interchange format', '3. Implement double-sign prevention', '4. Add surround vote protection', '5. Setup DB replication', '6. Implement backup/restore', '7. Add monitoring alerts', '8. Test protection', '9. Document procedures', '10. Create incident response'],
      outputFormat: 'JSON with slashing protection'
    },
    outputSchema: { type: 'object', required: ['slashingProtection', 'protectionMeasures', 'artifacts'], properties: { slashingProtection: { type: 'object' }, protectionMeasures: { type: 'array' }, dbConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'slashing']
}));

export const mevConfigurationTask = defineTask('mev-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEV Configuration - ${args.projectName}`,
  agent: {
    name: 'mev-engineer',
    prompt: {
      role: 'MEV Strategy Engineer',
      task: 'Configure MEV strategy',
      context: args,
      instructions: ['1. Evaluate MEV options', '2. Setup MEV-Boost', '3. Configure relay connections', '4. Add fallback mechanisms', '5. Configure bid filters', '6. Setup monitoring', '7. Analyze MEV revenue', '8. Configure privacy settings', '9. Test block building', '10. Document strategy'],
      outputFormat: 'JSON with MEV configuration'
    },
    outputSchema: { type: 'object', required: ['mevConfig', 'relays', 'artifacts'], properties: { mevConfig: { type: 'object' }, relays: { type: 'array' }, expectedRevenue: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'mev']
}));

export const monitoringAlertingTask = defineTask('monitoring-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring and Alerting - ${args.projectName}`,
  agent: {
    name: 'validator-monitoring',
    prompt: {
      role: 'Validator Monitoring Engineer',
      task: 'Setup validator monitoring',
      context: args,
      instructions: ['1. Setup metrics collection', '2. Monitor attestation performance', '3. Track proposal success', '4. Monitor sync status', '5. Track MEV revenue', '6. Setup alerting', '7. Create dashboards', '8. Monitor slashing events', '9. Track rewards', '10. Document monitoring'],
      outputFormat: 'JSON with monitoring setup'
    },
    outputSchema: { type: 'object', required: ['monitoring', 'dashboards', 'artifacts'], properties: { monitoring: { type: 'object' }, dashboards: { type: 'array' }, alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'monitoring']
}));

export const operationalProceduresTask = defineTask('operational-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operational Procedures - ${args.projectName}`,
  agent: {
    name: 'validator-ops',
    prompt: {
      role: 'Validator Operations Engineer',
      task: 'Create operational procedures',
      context: args,
      instructions: ['1. Document startup procedures', '2. Document shutdown procedures', '3. Create upgrade procedures', '4. Document key migration', '5. Create emergency procedures', '6. Document exit procedures', '7. Create runbooks', '8. Document maintenance', '9. Create SLA documentation', '10. Review procedures'],
      outputFormat: 'JSON with operational procedures'
    },
    outputSchema: { type: 'object', required: ['procedures', 'runbooks', 'artifacts'], properties: { procedures: { type: 'object' }, runbooks: { type: 'array' }, emergencyProcedures: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['validator', 'operations']
}));
