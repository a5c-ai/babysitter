/**
 * @process specializations/domains/business/legal/trade-secret-protection
 * @description Trade Secret Protection Program - Establish trade secret identification, classification,
 * access controls, and protection measures.
 * @inputs { organizationProfile: object, action?: string, outputDir?: string }
 * @outputs { success: boolean, tradeSecrets: array, protectionProgram: object, controls: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/trade-secret-protection', {
 *   organizationProfile: { name: 'Acme Corp', industry: 'manufacturing' },
 *   action: 'implement',
 *   outputDir: 'trade-secret-program'
 * });
 *
 * @references
 * - Defend Trade Secrets Act: https://www.congress.gov/bill/114th-congress/senate-bill/1890
 * - IP in the New Technological Age: https://www.westacademic.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    action = 'assess', // 'assess', 'classify', 'implement', 'audit'
    outputDir = 'trade-secret-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Trade Secret Protection Program for ${organizationProfile.name}`);

  // Phase 1: Trade Secret Identification
  const identification = await ctx.task(tradeSecretIdentificationTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...identification.artifacts);

  // Phase 2: Classification
  const classification = await ctx.task(tradeSecretClassificationTask, {
    tradeSecrets: identification.tradeSecrets,
    outputDir
  });
  artifacts.push(...classification.artifacts);

  // Phase 3: Access Control Design
  const accessControls = await ctx.task(accessControlDesignTask, {
    classifiedSecrets: classification.classifiedSecrets,
    outputDir
  });
  artifacts.push(...accessControls.artifacts);

  // Phase 4: Protection Measures
  const protectionMeasures = await ctx.task(protectionMeasuresTask, {
    classifiedSecrets: classification.classifiedSecrets,
    accessControls: accessControls.controls,
    outputDir
  });
  artifacts.push(...protectionMeasures.artifacts);

  // Phase 5: Policy Development
  const policies = await ctx.task(tradeSecretPolicyTask, {
    organizationProfile,
    protectionMeasures: protectionMeasures.measures,
    outputDir
  });
  artifacts.push(...policies.artifacts);

  // Phase 6: Training Plan
  const training = await ctx.task(tradeSecretTrainingTask, {
    organizationProfile,
    policies: policies.policies,
    outputDir
  });
  artifacts.push(...training.artifacts);

  await ctx.breakpoint({
    question: `Trade secret protection program for ${organizationProfile.name} complete. ${identification.tradeSecrets.length} trade secrets identified, ${accessControls.controls.length} controls implemented. Approve program?`,
    title: 'Trade Secret Protection Review',
    context: {
      runId: ctx.runId,
      tradeSecretsCount: identification.tradeSecrets.length,
      controlsCount: accessControls.controls.length,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  return {
    success: true,
    organization: organizationProfile.name,
    tradeSecrets: classification.classifiedSecrets,
    protectionProgram: {
      policies: policies.policies,
      measures: protectionMeasures.measures
    },
    controls: accessControls.controls,
    trainingPlan: training.plan,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/trade-secret-protection', timestamp: startTime }
  };
}

export const tradeSecretIdentificationTask = defineTask('trade-secret-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify trade secrets',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Trade Secret Specialist',
      task: 'Identify organizational trade secrets',
      context: args,
      instructions: ['Survey departments for confidential information', 'Identify proprietary processes', 'Document formulas and methods', 'Identify customer lists and data'],
      outputFormat: 'JSON with tradeSecrets array, artifacts'
    },
    outputSchema: { type: 'object', required: ['tradeSecrets', 'artifacts'], properties: { tradeSecrets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trade-secret']
}));

export const tradeSecretClassificationTask = defineTask('trade-secret-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify trade secrets',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Classification Specialist',
      task: 'Classify trade secrets by sensitivity',
      context: args,
      instructions: ['Classify by value', 'Classify by sensitivity', 'Assess competitive advantage', 'Document classification rationale'],
      outputFormat: 'JSON with classifiedSecrets array, artifacts'
    },
    outputSchema: { type: 'object', required: ['classifiedSecrets', 'artifacts'], properties: { classifiedSecrets: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trade-secret']
}));

export const accessControlDesignTask = defineTask('access-control-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design access controls',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Access Control Specialist',
      task: 'Design access controls for trade secrets',
      context: args,
      instructions: ['Define need-to-know access', 'Design physical security measures', 'Design digital access controls', 'Create access tracking'],
      outputFormat: 'JSON with controls array, artifacts'
    },
    outputSchema: { type: 'object', required: ['controls', 'artifacts'], properties: { controls: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trade-secret']
}));

export const protectionMeasuresTask = defineTask('protection-measures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design protection measures',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Protection Specialist',
      task: 'Design trade secret protection measures',
      context: args,
      instructions: ['Design marking/labeling requirements', 'Establish NDA requirements', 'Define employee exit procedures', 'Create vendor protection requirements'],
      outputFormat: 'JSON with measures array, artifacts'
    },
    outputSchema: { type: 'object', required: ['measures', 'artifacts'], properties: { measures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trade-secret']
}));

export const tradeSecretPolicyTask = defineTask('trade-secret-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop trade secret policies',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Policy Developer',
      task: 'Develop trade secret protection policies',
      context: args,
      instructions: ['Draft confidentiality policy', 'Draft information handling policy', 'Draft incident response procedures', 'Draft enforcement procedures'],
      outputFormat: 'JSON with policies array, artifacts'
    },
    outputSchema: { type: 'object', required: ['policies', 'artifacts'], properties: { policies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trade-secret']
}));

export const tradeSecretTrainingTask = defineTask('trade-secret-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training plan',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Training Developer',
      task: 'Develop trade secret awareness training',
      context: args,
      instructions: ['Design awareness training', 'Create handling procedures training', 'Develop role-specific training', 'Set training schedule'],
      outputFormat: 'JSON with plan object, artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trade-secret']
}));
