/**
 * @process specializations/cryptography-blockchain/blockchain-node-setup
 * @description Blockchain Node Setup and Operation - Setup and configuration of blockchain nodes for various networks
 * with proper security, monitoring, and high availability.
 * @inputs { projectName: string, network: string, nodeType?: string, highAvailability?: boolean }
 * @outputs { success: boolean, nodeInfo: object, configuration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/blockchain-node-setup', {
 *   projectName: 'Ethereum Archive Node',
 *   network: 'ethereum',
 *   nodeType: 'archive',
 *   highAvailability: true
 * });
 *
 * @references
 * - Geth Documentation: https://geth.ethereum.org/docs/
 * - Erigon: https://github.com/ledgerwatch/erigon
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    network,
    nodeType = 'full',
    highAvailability = false,
    client = 'geth',
    features = ['rpc', 'ws', 'metrics'],
    outputDir = 'node-setup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Blockchain Node Setup: ${projectName}`);

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, { projectName, network, nodeType, outputDir });
  artifacts.push(...requirementsAnalysis.artifacts);

  const infrastructureSetup = await ctx.task(infrastructureSetupTask, { projectName, highAvailability, outputDir });
  artifacts.push(...infrastructureSetup.artifacts);

  const nodeConfiguration = await ctx.task(nodeConfigurationTask, { projectName, client, network, nodeType, outputDir });
  artifacts.push(...nodeConfiguration.artifacts);

  const securityHardening = await ctx.task(securityHardeningTask, { projectName, outputDir });
  artifacts.push(...securityHardening.artifacts);

  const rpcConfiguration = await ctx.task(rpcConfigurationTask, { projectName, features, outputDir });
  artifacts.push(...rpcConfiguration.artifacts);

  const monitoringSetup = await ctx.task(monitoringSetupTask, { projectName, features, outputDir });
  artifacts.push(...monitoringSetup.artifacts);

  const backupRecovery = await ctx.task(backupRecoveryTask, { projectName, outputDir });
  artifacts.push(...backupRecovery.artifacts);

  const operationsGuide = await ctx.task(operationsGuideTask, { projectName, outputDir });
  artifacts.push(...operationsGuide.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    nodeInfo: { network, nodeType, client, highAvailability },
    configuration: nodeConfiguration.config,
    monitoring: monitoringSetup,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/blockchain-node-setup', timestamp: startTime }
  };
}

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'node-analyst',
    prompt: {
      role: 'Blockchain Node Analyst',
      task: 'Analyze node requirements',
      context: args,
      instructions: ['1. Analyze network requirements', '2. Determine storage needs', '3. Estimate bandwidth', '4. Plan CPU/RAM requirements', '5. Consider sync time', '6. Evaluate client options', '7. Plan redundancy', '8. Estimate costs', '9. Document requirements', '10. Create capacity plan'],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: { type: 'object', required: ['requirements', 'hardware', 'artifacts'], properties: { requirements: { type: 'object' }, hardware: { type: 'object' }, costs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'requirements']
}));

export const infrastructureSetupTask = defineTask('infrastructure-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Infrastructure Setup - ${args.projectName}`,
  agent: {
    name: 'infra-engineer',
    prompt: {
      role: 'Infrastructure Engineer',
      task: 'Setup node infrastructure',
      context: args,
      instructions: ['1. Provision servers', '2. Setup storage', '3. Configure networking', '4. Setup load balancers', '5. Configure DNS', '6. Setup firewall', '7. Configure SSL/TLS', '8. Setup bastion', '9. Test connectivity', '10. Document infrastructure'],
      outputFormat: 'JSON with infrastructure setup'
    },
    outputSchema: { type: 'object', required: ['infrastructure', 'networking', 'artifacts'], properties: { infrastructure: { type: 'object' }, networking: { type: 'object' }, securityGroups: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'infrastructure']
}));

export const nodeConfigurationTask = defineTask('node-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Node Configuration - ${args.projectName}`,
  agent: {
    name: 'node-engineer',
    prompt: {
      role: 'Node Configuration Engineer',
      task: 'Configure blockchain node',
      context: args,
      instructions: ['1. Install node client', '2. Configure chain params', '3. Setup data directory', '4. Configure pruning', '5. Setup state sync', '6. Configure P2P', '7. Setup bootnodes', '8. Configure cache', '9. Test configuration', '10. Document settings'],
      outputFormat: 'JSON with node configuration'
    },
    outputSchema: { type: 'object', required: ['config', 'chainParams', 'artifacts'], properties: { config: { type: 'object' }, chainParams: { type: 'object' }, syncStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'configuration']
}));

export const securityHardeningTask = defineTask('security-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Hardening - ${args.projectName}`,
  agent: {
    name: 'security-engineer',
    prompt: {
      role: 'Node Security Engineer',
      task: 'Harden node security',
      context: args,
      instructions: ['1. Secure OS configuration', '2. Configure firewall rules', '3. Setup fail2ban', '4. Secure RPC access', '5. Enable rate limiting', '6. Configure authentication', '7. Secure key storage', '8. Setup audit logging', '9. Test security', '10. Document security measures'],
      outputFormat: 'JSON with security hardening'
    },
    outputSchema: { type: 'object', required: ['securityMeasures', 'firewallRules', 'artifacts'], properties: { securityMeasures: { type: 'array' }, firewallRules: { type: 'array' }, auditConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'security']
}));

export const rpcConfigurationTask = defineTask('rpc-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `RPC Configuration - ${args.projectName}`,
  agent: {
    name: 'rpc-engineer',
    prompt: {
      role: 'RPC Configuration Engineer',
      task: 'Configure RPC endpoints',
      context: args,
      instructions: ['1. Configure HTTP RPC', '2. Setup WebSocket', '3. Configure namespaces', '4. Add rate limiting', '5. Setup CORS', '6. Configure authentication', '7. Add caching', '8. Setup load balancing', '9. Test endpoints', '10. Document API'],
      outputFormat: 'JSON with RPC configuration'
    },
    outputSchema: { type: 'object', required: ['rpcConfig', 'endpoints', 'artifacts'], properties: { rpcConfig: { type: 'object' }, endpoints: { type: 'array' }, rateLimits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'rpc']
}));

export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring Setup - ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'Node Monitoring Engineer',
      task: 'Setup node monitoring',
      context: args,
      instructions: ['1. Setup Prometheus', '2. Configure node metrics', '3. Setup Grafana dashboards', '4. Add alerting', '5. Monitor sync status', '6. Track peer count', '7. Monitor disk usage', '8. Add log aggregation', '9. Test alerting', '10. Document monitoring'],
      outputFormat: 'JSON with monitoring setup'
    },
    outputSchema: { type: 'object', required: ['monitoring', 'dashboards', 'artifacts'], properties: { monitoring: { type: 'object' }, dashboards: { type: 'array' }, alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'monitoring']
}));

export const backupRecoveryTask = defineTask('backup-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backup and Recovery - ${args.projectName}`,
  agent: {
    name: 'backup-engineer',
    prompt: {
      role: 'Backup Recovery Engineer',
      task: 'Setup backup and recovery',
      context: args,
      instructions: ['1. Design backup strategy', '2. Setup automated backups', '3. Configure retention', '4. Test restore process', '5. Document RTO/RPO', '6. Setup offsite backups', '7. Implement snapshots', '8. Add backup monitoring', '9. Test disaster recovery', '10. Document procedures'],
      outputFormat: 'JSON with backup recovery'
    },
    outputSchema: { type: 'object', required: ['backupStrategy', 'recoveryProcedures', 'artifacts'], properties: { backupStrategy: { type: 'object' }, recoveryProcedures: { type: 'object' }, rtoRpo: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'backup']
}));

export const operationsGuideTask = defineTask('operations-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operations Guide - ${args.projectName}`,
  agent: {
    name: 'ops-documenter',
    prompt: {
      role: 'Node Operations Documenter',
      task: 'Create operations guide',
      context: args,
      instructions: ['1. Document startup procedures', '2. Document shutdown procedures', '3. Create troubleshooting guide', '4. Document upgrades', '5. Create runbooks', '6. Document incident response', '7. Add on-call procedures', '8. Document maintenance', '9. Create FAQ', '10. Review documentation'],
      outputFormat: 'JSON with operations guide'
    },
    outputSchema: { type: 'object', required: ['operationsGuide', 'runbooks', 'artifacts'], properties: { operationsGuide: { type: 'object' }, runbooks: { type: 'array' }, troubleshooting: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['node', 'operations']
}));
