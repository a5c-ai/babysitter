/**
 * @process specializations/domains/business/legal/board-governance-framework
 * @description Board Governance Framework - Implement board meeting management, committee structures,
 * documentation, and governance compliance procedures.
 * @inputs { organizationProfile: object, action?: string, meetingId?: string, outputDir?: string }
 * @outputs { success: boolean, governanceStructure: object, committees: array, meetings: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/board-governance-framework', {
 *   organizationProfile: { name: 'Acme Corp', type: 'public-company' },
 *   action: 'implement',
 *   outputDir: 'board-governance'
 * });
 *
 * @references
 * - NACD Board Leadership: https://www.nacdonline.org/education/certification/
 * - UK Corporate Governance Code: https://www.frc.org.uk/directors/corporate-governance-and-stewardship/uk-corporate-governance-code
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    action = 'implement', // 'implement', 'manage-meeting', 'review', 'report'
    meetingId = null,
    outputDir = 'board-governance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Board Governance Framework for ${organizationProfile.name}`);

  // Phase 1: Governance Structure Design
  const structureDesign = await ctx.task(governanceStructureDesignTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...structureDesign.artifacts);

  // Phase 2: Committee Structure
  const committeeStructure = await ctx.task(committeeStructureTask, {
    organizationProfile,
    governanceStructure: structureDesign.structure,
    outputDir
  });
  artifacts.push(...committeeStructure.artifacts);

  // Phase 3: Board Charter Development
  const charterDevelopment = await ctx.task(boardCharterTask, {
    organizationProfile,
    governanceStructure: structureDesign.structure,
    committees: committeeStructure.committees,
    outputDir
  });
  artifacts.push(...charterDevelopment.artifacts);

  // Phase 4: Meeting Management Setup
  const meetingManagement = await ctx.task(meetingManagementTask, {
    organizationProfile,
    committees: committeeStructure.committees,
    outputDir
  });
  artifacts.push(...meetingManagement.artifacts);

  // Phase 5: Documentation Standards
  const documentationStandards = await ctx.task(governanceDocumentationTask, {
    organizationProfile,
    outputDir
  });
  artifacts.push(...documentationStandards.artifacts);

  // Phase 6: Compliance Framework
  const complianceFramework = await ctx.task(governanceComplianceTask, {
    organizationProfile,
    governanceStructure: structureDesign.structure,
    outputDir
  });
  artifacts.push(...complianceFramework.artifacts);

  await ctx.breakpoint({
    question: `Board governance framework for ${organizationProfile.name} complete. ${committeeStructure.committees.length} committees defined. Review and approve?`,
    title: 'Board Governance Review',
    context: {
      runId: ctx.runId,
      committeesCount: committeeStructure.committees.length,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  return {
    success: true,
    organization: organizationProfile.name,
    governanceStructure: structureDesign.structure,
    committees: committeeStructure.committees,
    charters: charterDevelopment.charters,
    meetingCalendar: meetingManagement.calendar,
    complianceChecks: complianceFramework.checks,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/board-governance-framework', timestamp: startTime }
  };
}

export const governanceStructureDesignTask = defineTask('governance-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance structure',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Corporate Governance Specialist',
      task: 'Design board governance structure',
      context: args,
      instructions: ['Define board composition', 'Establish director roles', 'Define independence requirements', 'Design reporting structure'],
      outputFormat: 'JSON with structure object, artifacts'
    },
    outputSchema: { type: 'object', required: ['structure', 'artifacts'], properties: { structure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'board-governance']
}));

export const committeeStructureTask = defineTask('committee-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define committee structure',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Committee Structure Specialist',
      task: 'Define board committee structure',
      context: args,
      instructions: ['Define required committees', 'Establish committee charters', 'Define membership requirements', 'Set meeting frequency'],
      outputFormat: 'JSON with committees array, artifacts'
    },
    outputSchema: { type: 'object', required: ['committees', 'artifacts'], properties: { committees: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'board-governance']
}));

export const boardCharterTask = defineTask('board-charter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop board charters',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Charter Development Specialist',
      task: 'Develop board and committee charters',
      context: args,
      instructions: ['Draft board charter', 'Draft committee charters', 'Define responsibilities', 'Include compliance requirements'],
      outputFormat: 'JSON with charters array, artifacts'
    },
    outputSchema: { type: 'object', required: ['charters', 'artifacts'], properties: { charters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'board-governance']
}));

export const meetingManagementTask = defineTask('meeting-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up meeting management',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Meeting Management Specialist',
      task: 'Set up board meeting management',
      context: args,
      instructions: ['Create annual meeting calendar', 'Define agenda templates', 'Establish materials distribution', 'Set up minute-taking procedures'],
      outputFormat: 'JSON with calendar object, templates, artifacts'
    },
    outputSchema: { type: 'object', required: ['calendar', 'artifacts'], properties: { calendar: { type: 'object' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'board-governance']
}));

export const governanceDocumentationTask = defineTask('governance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish documentation standards',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Documentation Standards Specialist',
      task: 'Establish governance documentation standards',
      context: args,
      instructions: ['Define minute-taking standards', 'Establish resolution formats', 'Define record retention', 'Create document templates'],
      outputFormat: 'JSON with standards object, templates, artifacts'
    },
    outputSchema: { type: 'object', required: ['standards', 'artifacts'], properties: { standards: { type: 'object' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'board-governance']
}));

export const governanceComplianceTask = defineTask('governance-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish compliance framework',
  agent: {
    name: 'corporate-governance-specialist',
    prompt: {
      role: 'Governance Compliance Specialist',
      task: 'Establish governance compliance framework',
      context: args,
      instructions: ['Define compliance requirements', 'Create compliance checklist', 'Set up monitoring', 'Define reporting requirements'],
      outputFormat: 'JSON with checks array, monitoringPlan, artifacts'
    },
    outputSchema: { type: 'object', required: ['checks', 'artifacts'], properties: { checks: { type: 'array' }, monitoringPlan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'board-governance']
}));
