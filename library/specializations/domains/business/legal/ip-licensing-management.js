/**
 * @process specializations/domains/business/legal/ip-licensing-management
 * @description IP Licensing Management - Implement inbound and outbound licensing workflows including
 * negotiation, royalty tracking, and compliance monitoring.
 * @inputs { licenseType: string, direction?: string, ipAsset?: object, outputDir?: string }
 * @outputs { success: boolean, licenseAgreement: object, royaltySchedule: object, complianceChecks: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/ip-licensing-management', {
 *   licenseType: 'patent-license',
 *   direction: 'outbound',
 *   ipAsset: { type: 'patent', id: 'US-10,000,001', title: 'AI Contract Analysis' },
 *   outputDir: 'licensing'
 * });
 *
 * @references
 * - Licensing Intellectual Property: https://www.wiley.com/en-us/Licensing+Intellectual+Property%3A+Law+and+Management-p-9781118432174
 * - LESI: https://www.lesi.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    licenseType,
    direction = 'outbound', // 'inbound', 'outbound'
    ipAsset = null,
    licensee = null,
    licensor = null,
    outputDir = 'licensing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting IP Licensing Management - ${direction} ${licenseType}`);

  // Phase 1: License Scope Definition
  const scopeDefinition = await ctx.task(licenseScopeTask, {
    licenseType,
    direction,
    ipAsset,
    outputDir
  });
  artifacts.push(...scopeDefinition.artifacts);

  // Phase 2: Valuation
  const valuation = await ctx.task(licenseValuationTask, {
    ipAsset,
    scope: scopeDefinition.scope,
    outputDir
  });
  artifacts.push(...valuation.artifacts);

  // Phase 3: Agreement Drafting
  const agreement = await ctx.task(licenseAgreementDraftingTask, {
    licenseType,
    direction,
    ipAsset,
    scope: scopeDefinition.scope,
    valuation: valuation.valuation,
    outputDir
  });
  artifacts.push(...agreement.artifacts);

  // Phase 4: Negotiation Support
  const negotiation = await ctx.task(licenseNegotiationTask, {
    agreement: agreement.draft,
    direction,
    outputDir
  });
  artifacts.push(...negotiation.artifacts);

  await ctx.breakpoint({
    question: `License agreement draft complete for ${licenseType}. Royalty rate: ${valuation.recommendedRoyalty}. Review and finalize?`,
    title: 'License Agreement Review',
    context: {
      runId: ctx.runId,
      licenseType,
      direction,
      royaltyRate: valuation.recommendedRoyalty,
      files: [{ path: agreement.draftPath, format: 'docx', label: 'License Agreement' }]
    }
  });

  // Phase 5: Royalty Tracking Setup
  const royaltyTracking = await ctx.task(royaltyTrackingTask, {
    agreement: agreement.draft,
    valuation: valuation.valuation,
    outputDir
  });
  artifacts.push(...royaltyTracking.artifacts);

  // Phase 6: Compliance Monitoring Setup
  const compliance = await ctx.task(licenseComplianceTask, {
    agreement: agreement.draft,
    outputDir
  });
  artifacts.push(...compliance.artifacts);

  return {
    success: true,
    licenseType,
    direction,
    licenseAgreement: {
      path: agreement.draftPath,
      terms: agreement.keyTerms
    },
    royaltySchedule: royaltyTracking.schedule,
    complianceChecks: compliance.checks,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/ip-licensing-management', timestamp: startTime }
  };
}

export const licenseScopeTask = defineTask('license-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define license scope',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Licensing Specialist',
      task: 'Define IP license scope',
      context: args,
      instructions: ['Define licensed IP rights', 'Specify field of use', 'Define geographic scope', 'Set exclusivity terms', 'Define sublicensing rights'],
      outputFormat: 'JSON with scope object, artifacts'
    },
    outputSchema: { type: 'object', required: ['scope', 'artifacts'], properties: { scope: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'licensing']
}));

export const licenseValuationTask = defineTask('license-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Value IP license',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'IP Valuation Specialist',
      task: 'Value IP for licensing',
      context: args,
      instructions: ['Assess IP value', 'Research comparable licenses', 'Calculate recommended royalty rate', 'Determine upfront fees'],
      outputFormat: 'JSON with valuation object, recommendedRoyalty, artifacts'
    },
    outputSchema: { type: 'object', required: ['valuation', 'recommendedRoyalty', 'artifacts'], properties: { valuation: { type: 'object' }, recommendedRoyalty: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'licensing']
}));

export const licenseAgreementDraftingTask = defineTask('license-agreement-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft license agreement',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'License Drafter',
      task: 'Draft IP license agreement',
      context: args,
      instructions: ['Select appropriate template', 'Draft license grant', 'Include payment terms', 'Add representations and warranties', 'Include termination provisions'],
      outputFormat: 'JSON with draft object, draftPath, keyTerms, artifacts'
    },
    outputSchema: { type: 'object', required: ['draft', 'draftPath', 'artifacts'], properties: { draft: { type: 'object' }, draftPath: { type: 'string' }, keyTerms: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'licensing']
}));

export const licenseNegotiationTask = defineTask('license-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Support license negotiation',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Negotiation Specialist',
      task: 'Support license negotiation',
      context: args,
      instructions: ['Identify negotiable terms', 'Define fallback positions', 'Prepare negotiation guidance', 'Document deal breakers'],
      outputFormat: 'JSON with negotiationGuide object, artifacts'
    },
    outputSchema: { type: 'object', required: ['negotiationGuide', 'artifacts'], properties: { negotiationGuide: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'licensing']
}));

export const royaltyTrackingTask = defineTask('royalty-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up royalty tracking',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Royalty Tracking Specialist',
      task: 'Set up royalty tracking system',
      context: args,
      instructions: ['Create royalty payment schedule', 'Set up reporting requirements', 'Define audit rights', 'Configure tracking system'],
      outputFormat: 'JSON with schedule object, artifacts'
    },
    outputSchema: { type: 'object', required: ['schedule', 'artifacts'], properties: { schedule: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'licensing']
}));

export const licenseComplianceTask = defineTask('license-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up compliance monitoring',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'License Compliance Specialist',
      task: 'Set up license compliance monitoring',
      context: args,
      instructions: ['Define compliance checkpoints', 'Set up usage monitoring', 'Create audit procedures', 'Document enforcement procedures'],
      outputFormat: 'JSON with checks array, artifacts'
    },
    outputSchema: { type: 'object', required: ['checks', 'artifacts'], properties: { checks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'licensing']
}));
