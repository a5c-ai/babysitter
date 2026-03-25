/**
 * @process specializations/cryptography-blockchain/bug-bounty-program
 * @description Bug Bounty Program Setup - Setup and management of bug bounty programs for smart contract security
 * with vulnerability disclosure, triage, and reward processes.
 * @inputs { projectName: string, scope: array, maxReward?: number, platform?: string }
 * @outputs { success: boolean, programInfo: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/bug-bounty-program', {
 *   projectName: 'DeFi Protocol Bug Bounty',
 *   scope: ['core-contracts', 'periphery', 'frontend'],
 *   maxReward: 500000,
 *   platform: 'immunefi'
 * });
 *
 * @references
 * - Immunefi: https://immunefi.com/
 * - Code4rena: https://code4rena.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    scope,
    maxReward = 100000,
    platform = 'immunefi',
    severityLevels = ['critical', 'high', 'medium', 'low'],
    features = ['private-disclosure', 'safe-harbor'],
    outputDir = 'bounty-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Bug Bounty Program Setup: ${projectName}`);

  const programDesign = await ctx.task(programDesignTask, { projectName, scope, maxReward, outputDir });
  artifacts.push(...programDesign.artifacts);

  const scopeDefinition = await ctx.task(scopeDefinitionTask, { projectName, scope, outputDir });
  artifacts.push(...scopeDefinition.artifacts);

  const rewardStructure = await ctx.task(rewardStructureTask, { projectName, maxReward, severityLevels, outputDir });
  artifacts.push(...rewardStructure.artifacts);

  const disclosurePolicy = await ctx.task(disclosurePolicyTask, { projectName, features, outputDir });
  artifacts.push(...disclosurePolicy.artifacts);

  const triageProcess = await ctx.task(triageProcessTask, { projectName, outputDir });
  artifacts.push(...triageProcess.artifacts);

  const platformIntegration = await ctx.task(platformIntegrationTask, { projectName, platform, outputDir });
  artifacts.push(...platformIntegration.artifacts);

  const legalDocumentation = await ctx.task(legalDocumentationTask, { projectName, features, outputDir });
  artifacts.push(...legalDocumentation.artifacts);

  const launchPreparation = await ctx.task(launchPreparationTask, { projectName, platform, outputDir });
  artifacts.push(...launchPreparation.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    programInfo: { scope, maxReward, platform, severityLevels },
    documentation: { disclosure: disclosurePolicy, legal: legalDocumentation },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/bug-bounty-program', timestamp: startTime }
  };
}

export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Program Design - ${args.projectName}`,
  agent: {
    name: 'bounty-architect',
    prompt: {
      role: 'Bug Bounty Program Architect',
      task: 'Design bug bounty program',
      context: args,
      instructions: ['1. Define program objectives', '2. Analyze competitors', '3. Set budget allocation', '4. Plan severity levels', '5. Define response times', '6. Plan triage workflow', '7. Define escalation paths', '8. Plan communications', '9. Document program', '10. Create timeline'],
      outputFormat: 'JSON with program design'
    },
    outputSchema: { type: 'object', required: ['design', 'objectives', 'artifacts'], properties: { design: { type: 'object' }, objectives: { type: 'array' }, budget: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'design']
}));

export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scope Definition - ${args.projectName}`,
  agent: {
    name: 'scope-engineer',
    prompt: {
      role: 'Scope Definition Engineer',
      task: 'Define program scope',
      context: args,
      instructions: ['1. List in-scope assets', '2. Define out-of-scope', '3. Specify contract addresses', '4. List frontend scope', '5. Define API scope', '6. Specify environments', '7. List known issues', '8. Define impact criteria', '9. Document exclusions', '10. Create scope document'],
      outputFormat: 'JSON with scope definition'
    },
    outputSchema: { type: 'object', required: ['inScope', 'outOfScope', 'artifacts'], properties: { inScope: { type: 'array' }, outOfScope: { type: 'array' }, knownIssues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'scope']
}));

export const rewardStructureTask = defineTask('reward-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reward Structure - ${args.projectName}`,
  agent: {
    name: 'reward-engineer',
    prompt: {
      role: 'Reward Structure Engineer',
      task: 'Define reward structure',
      context: args,
      instructions: ['1. Define severity levels', '2. Set reward ranges', '3. Define impact factors', '4. Add bonus criteria', '5. Define payment terms', '6. Handle duplicates', '7. Define proof requirements', '8. Add quality bonuses', '9. Document structure', '10. Compare with market'],
      outputFormat: 'JSON with reward structure'
    },
    outputSchema: { type: 'object', required: ['rewardTable', 'severityDefinitions', 'artifacts'], properties: { rewardTable: { type: 'object' }, severityDefinitions: { type: 'object' }, bonusCriteria: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'rewards']
}));

export const disclosurePolicyTask = defineTask('disclosure-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Disclosure Policy - ${args.projectName}`,
  agent: {
    name: 'disclosure-engineer',
    prompt: {
      role: 'Disclosure Policy Engineer',
      task: 'Create disclosure policy',
      context: args,
      instructions: ['1. Define disclosure process', '2. Set response timelines', '3. Define confidentiality', '4. Add safe harbor', '5. Define publication rules', '6. Add researcher rights', '7. Define team obligations', '8. Handle disputes', '9. Document policy', '10. Review legal compliance'],
      outputFormat: 'JSON with disclosure policy'
    },
    outputSchema: { type: 'object', required: ['policy', 'timelines', 'artifacts'], properties: { policy: { type: 'object' }, timelines: { type: 'object' }, safeHarbor: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'disclosure']
}));

export const triageProcessTask = defineTask('triage-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage Process - ${args.projectName}`,
  agent: {
    name: 'triage-engineer',
    prompt: {
      role: 'Triage Process Engineer',
      task: 'Define triage process',
      context: args,
      instructions: ['1. Define triage workflow', '2. Set SLA targets', '3. Define severity assessment', '4. Create triage checklist', '5. Define escalation criteria', '6. Add reproduction steps', '7. Define fix validation', '8. Add communication templates', '9. Document process', '10. Create runbook'],
      outputFormat: 'JSON with triage process'
    },
    outputSchema: { type: 'object', required: ['workflow', 'slaTargets', 'artifacts'], properties: { workflow: { type: 'object' }, slaTargets: { type: 'object' }, checklist: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'triage']
}));

export const platformIntegrationTask = defineTask('platform-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Integration - ${args.projectName}`,
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Platform Integration Engineer',
      task: 'Integrate with bounty platform',
      context: args,
      instructions: ['1. Setup platform account', '2. Configure program details', '3. Upload scope documentation', '4. Configure rewards', '5. Setup team members', '6. Configure notifications', '7. Setup API integration', '8. Test submission flow', '9. Configure dashboard', '10. Document integration'],
      outputFormat: 'JSON with platform integration'
    },
    outputSchema: { type: 'object', required: ['integration', 'configuration', 'artifacts'], properties: { integration: { type: 'object' }, configuration: { type: 'object' }, apiSetup: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'platform']
}));

export const legalDocumentationTask = defineTask('legal-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Legal Documentation - ${args.projectName}`,
  agent: {
    name: 'legal-engineer',
    prompt: {
      role: 'Legal Documentation Engineer',
      task: 'Create legal documentation',
      context: args,
      instructions: ['1. Draft terms and conditions', '2. Create safe harbor agreement', '3. Define IP rights', '4. Add confidentiality terms', '5. Define liability limits', '6. Add compliance requirements', '7. Define dispute resolution', '8. Add jurisdiction terms', '9. Review with legal', '10. Finalize documents'],
      outputFormat: 'JSON with legal documentation'
    },
    outputSchema: { type: 'object', required: ['documents', 'terms', 'artifacts'], properties: { documents: { type: 'array' }, terms: { type: 'object' }, safeHarbor: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'legal']
}));

export const launchPreparationTask = defineTask('launch-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Launch Preparation - ${args.projectName}`,
  agent: {
    name: 'launch-engineer',
    prompt: {
      role: 'Launch Preparation Engineer',
      task: 'Prepare program launch',
      context: args,
      instructions: ['1. Finalize all documentation', '2. Setup monitoring', '3. Prepare announcement', '4. Brief security team', '5. Test submission flow', '6. Verify payment process', '7. Setup communication channels', '8. Create FAQ', '9. Plan marketing', '10. Launch program'],
      outputFormat: 'JSON with launch preparation'
    },
    outputSchema: { type: 'object', required: ['launchPlan', 'checklist', 'artifacts'], properties: { launchPlan: { type: 'object' }, checklist: { type: 'array' }, announcement: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['bounty', 'launch']
}));
