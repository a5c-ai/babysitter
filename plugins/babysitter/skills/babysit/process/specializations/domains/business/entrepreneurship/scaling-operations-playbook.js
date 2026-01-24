/**
 * @process specializations/domains/business/entrepreneurship/scaling-operations-playbook
 * @description Scaling Operations Playbook Process - Comprehensive process for creating operational playbooks to scale from startup to growth stage.
 * @inputs { companyName: string, currentStage: string, targetScale: string, operations?: object, teamSize?: number }
 * @outputs { success: boolean, scalingPlaybook: object, operationalFrameworks: array, processDocumentation: object, organizationDesign: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/scaling-operations-playbook', {
 *   companyName: 'ScaleUp Inc',
 *   currentStage: 'Series A',
 *   targetScale: '10x revenue in 18 months',
 *   teamSize: 25
 * });
 *
 * @references
 * - Scaling Up (Verne Harnish): https://scalingup.com/
 * - High Growth Handbook (Elad Gil): https://growth.eladgil.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, currentStage, targetScale, operations = {}, teamSize = 0 } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Scaling Operations Playbook for ${companyName}`);

  // Phase 1: Current State Assessment
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, { companyName, currentStage, operations, teamSize });
  artifacts.push(...(currentStateAssessment.artifacts || []));

  // Phase 2: Scaling Requirements Analysis
  const scalingRequirements = await ctx.task(scalingRequirementsTask, { companyName, targetScale, currentStateAssessment });
  artifacts.push(...(scalingRequirements.artifacts || []));

  // Phase 3: Process Mapping
  const processMapping = await ctx.task(processMappingTask, { companyName, currentStateAssessment, scalingRequirements });
  artifacts.push(...(processMapping.artifacts || []));

  // Phase 4: Process Optimization
  const processOptimization = await ctx.task(processOptimizationTask, { companyName, processMapping });
  artifacts.push(...(processOptimization.artifacts || []));

  // Breakpoint: Review optimized processes
  await ctx.breakpoint({
    question: `Review process optimization for ${companyName}. ${processOptimization.optimizationsCount || 0} optimizations identified. Proceed with org design?`,
    title: 'Process Optimization Review',
    context: { runId: ctx.runId, companyName, optimizations: processOptimization.optimizationsCount, files: artifacts }
  });

  // Phase 5: Organization Design
  const organizationDesign = await ctx.task(organizationDesignTask, { companyName, scalingRequirements, teamSize });
  artifacts.push(...(organizationDesign.artifacts || []));

  // Phase 6: Systems and Tools Planning
  const systemsPlanning = await ctx.task(systemsPlanningTask, { companyName, processOptimization, scalingRequirements });
  artifacts.push(...(systemsPlanning.artifacts || []));

  // Phase 7: Metrics and KPIs Framework
  const metricsFramework = await ctx.task(metricsFrameworkTask, { companyName, processOptimization, scalingRequirements });
  artifacts.push(...(metricsFramework.artifacts || []));

  // Phase 8: Change Management Plan
  const changeManagement = await ctx.task(changeManagementTask, { companyName, processOptimization, organizationDesign });
  artifacts.push(...(changeManagement.artifacts || []));

  // Phase 9: Playbook Documentation
  const playbookDocumentation = await ctx.task(playbookDocumentationTask, {
    companyName, processOptimization, organizationDesign, systemsPlanning, metricsFramework
  });
  artifacts.push(...(playbookDocumentation.artifacts || []));

  // Phase 10: Implementation Roadmap
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, { companyName, playbookDocumentation, changeManagement });
  artifacts.push(...(implementationRoadmap.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    scalingPlaybook: playbookDocumentation,
    operationalFrameworks: processOptimization.frameworks,
    processDocumentation: processMapping,
    organizationDesign,
    implementationRoadmap,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/scaling-operations-playbook', timestamp: startTime, version: '1.0.0' }
  };
}

export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Current State Assessment - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Operations Strategy Expert', task: 'Assess current operational state', context: args,
    instructions: ['1. Document current processes', '2. Map organizational structure', '3. Inventory systems and tools', '4. Assess team capabilities', '5. Identify bottlenecks', '6. Document tribal knowledge', '7. Measure process efficiency', '8. Identify technical debt', '9. Assess scalability gaps', '10. Create current state report'],
    outputFormat: 'JSON with currentState, bottlenecks, gaps' },
    outputSchema: { type: 'object', required: ['currentState', 'bottlenecks'], properties: { currentState: { type: 'object' }, bottlenecks: { type: 'array', items: { type: 'string' } }, gaps: { type: 'array', items: { type: 'string' } }, capabilities: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'assessment']
}));

export const scalingRequirementsTask = defineTask('scaling-requirements', (args, taskCtx) => ({
  kind: 'agent', title: `Scaling Requirements Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Scaling Strategy Expert', task: 'Define scaling requirements', context: args,
    instructions: ['1. Define scale targets', '2. Identify capacity requirements', '3. Define headcount needs', '4. Identify system requirements', '5. Define process requirements', '6. Identify risk factors', '7. Define timeline constraints', '8. Identify dependencies', '9. Define success criteria', '10. Create requirements document'],
    outputFormat: 'JSON with requirements, capacity, timeline' },
    outputSchema: { type: 'object', required: ['requirements', 'capacity'], properties: { requirements: { type: 'array', items: { type: 'object' } }, capacity: { type: 'object' }, headcount: { type: 'object' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'requirements']
}));

export const processMappingTask = defineTask('process-mapping', (args, taskCtx) => ({
  kind: 'agent', title: `Process Mapping - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Process Engineering Expert', task: 'Map all business processes', context: args,
    instructions: ['1. Map core processes', '2. Map support processes', '3. Map management processes', '4. Document process flows', '5. Identify process owners', '6. Document inputs/outputs', '7. Identify handoffs', '8. Document SLAs', '9. Identify automation candidates', '10. Create process documentation'],
    outputFormat: 'JSON with processes, flows, owners' },
    outputSchema: { type: 'object', required: ['processes', 'flows'], properties: { processes: { type: 'array', items: { type: 'object' } }, flows: { type: 'array', items: { type: 'object' } }, owners: { type: 'object' }, automationCandidates: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'process-mapping']
}));

export const processOptimizationTask = defineTask('process-optimization', (args, taskCtx) => ({
  kind: 'agent', title: `Process Optimization - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Lean Operations Expert', task: 'Optimize processes for scale', context: args,
    instructions: ['1. Apply lean principles', '2. Eliminate waste', '3. Standardize processes', '4. Design for automation', '5. Create playbooks', '6. Define escalation paths', '7. Build quality gates', '8. Design feedback loops', '9. Create training materials', '10. Document optimized processes'],
    outputFormat: 'JSON with optimizations, frameworks, playbooks' },
    outputSchema: { type: 'object', required: ['optimizations', 'frameworks'], properties: { optimizations: { type: 'array', items: { type: 'object' } }, optimizationsCount: { type: 'number' }, frameworks: { type: 'array', items: { type: 'object' } }, playbooks: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'optimization']
}));

export const organizationDesignTask = defineTask('organization-design', (args, taskCtx) => ({
  kind: 'agent', title: `Organization Design - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Organizational Design Expert', task: 'Design scaled organization structure', context: args,
    instructions: ['1. Design org structure', '2. Define reporting lines', '3. Define roles and responsibilities', '4. Design team structures', '5. Plan span of control', '6. Design communication flows', '7. Define decision rights', '8. Plan for management layers', '9. Design cross-functional teams', '10. Create org chart and RACI'],
    outputFormat: 'JSON with orgStructure, roles, teams' },
    outputSchema: { type: 'object', required: ['orgStructure', 'roles'], properties: { orgStructure: { type: 'object' }, roles: { type: 'array', items: { type: 'object' } }, teams: { type: 'array', items: { type: 'object' } }, raci: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'org-design']
}));

export const systemsPlanningTask = defineTask('systems-planning', (args, taskCtx) => ({
  kind: 'agent', title: `Systems and Tools Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Systems Architecture Expert', task: 'Plan systems and tools for scale', context: args,
    instructions: ['1. Inventory current systems', '2. Identify system gaps', '3. Evaluate tool options', '4. Design integration architecture', '5. Plan data flows', '6. Define security requirements', '7. Plan migration strategy', '8. Define vendor criteria', '9. Create implementation plan', '10. Document systems roadmap'],
    outputFormat: 'JSON with systems, integrations, roadmap' },
    outputSchema: { type: 'object', required: ['systems', 'roadmap'], properties: { systems: { type: 'array', items: { type: 'object' } }, integrations: { type: 'array', items: { type: 'object' } }, roadmap: { type: 'array', items: { type: 'object' } }, migrationPlan: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'systems']
}));

export const metricsFrameworkTask = defineTask('metrics-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Metrics and KPIs Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Performance Management Expert', task: 'Design metrics and KPIs framework', context: args,
    instructions: ['1. Define OKRs framework', '2. Define department KPIs', '3. Define individual metrics', '4. Design dashboards', '5. Define reporting cadence', '6. Create scorecards', '7. Define alert thresholds', '8. Plan for benchmarking', '9. Design review processes', '10. Document metrics playbook'],
    outputFormat: 'JSON with okrs, kpis, dashboards' },
    outputSchema: { type: 'object', required: ['okrs', 'kpis'], properties: { okrs: { type: 'object' }, kpis: { type: 'array', items: { type: 'object' } }, dashboards: { type: 'array', items: { type: 'object' } }, scorecards: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'metrics']
}));

export const changeManagementTask = defineTask('change-management', (args, taskCtx) => ({
  kind: 'agent', title: `Change Management Plan - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Change Management Expert', task: 'Create change management plan', context: args,
    instructions: ['1. Assess change readiness', '2. Identify stakeholders', '3. Create communication plan', '4. Design training programs', '5. Plan for resistance', '6. Define change champions', '7. Create feedback mechanisms', '8. Plan rollout phases', '9. Define success metrics', '10. Document change playbook'],
    outputFormat: 'JSON with changePlan, communications, training' },
    outputSchema: { type: 'object', required: ['changePlan', 'communications'], properties: { changePlan: { type: 'object' }, communications: { type: 'array', items: { type: 'object' } }, training: { type: 'array', items: { type: 'object' } }, rolloutPhases: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'change-management']
}));

export const playbookDocumentationTask = defineTask('playbook-documentation', (args, taskCtx) => ({
  kind: 'agent', title: `Playbook Documentation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Technical Writing Expert', task: 'Create comprehensive scaling playbook', context: args,
    instructions: ['1. Structure playbook sections', '2. Document process playbooks', '3. Create role playbooks', '4. Document system guides', '5. Create training materials', '6. Document escalation procedures', '7. Create checklists', '8. Document templates', '9. Create quick reference guides', '10. Assemble master playbook'],
    outputFormat: 'JSON with playbook, sections, materials' },
    outputSchema: { type: 'object', required: ['playbook', 'sections'], properties: { playbook: { type: 'object' }, sections: { type: 'array', items: { type: 'object' } }, materials: { type: 'array', items: { type: 'object' } }, templates: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'documentation']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent', title: `Implementation Roadmap - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Program Management Expert', task: 'Create implementation roadmap', context: args,
    instructions: ['1. Define implementation phases', '2. Create detailed timeline', '3. Assign ownership', '4. Define milestones', '5. Identify dependencies', '6. Plan resource allocation', '7. Define checkpoints', '8. Create risk mitigation plan', '9. Define success criteria', '10. Document implementation plan'],
    outputFormat: 'JSON with roadmap, phases, milestones' },
    outputSchema: { type: 'object', required: ['roadmap', 'phases'], properties: { roadmap: { type: 'object' }, phases: { type: 'array', items: { type: 'object' } }, milestones: { type: 'array', items: { type: 'object' } }, risks: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'scaling', 'implementation']
}));
