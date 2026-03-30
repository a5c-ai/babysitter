/**
 * @process specializations/domains/business/decision-intelligence/competitor-monitoring-system
 * @description Competitor Monitoring System Setup - Implementation of systematic competitor tracking including
 * information sources, collection processes, analysis frameworks, and dissemination workflows.
 * @inputs { projectName: string, competitors: array, monitoringScope: object, stakeholders: array, industryContext?: object }
 * @outputs { success: boolean, monitoringSystem: object, sourcesInventory: array, analysisFramework: object, disseminationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/competitor-monitoring-system', {
 *   projectName: 'Enterprise Competitive Intelligence Program',
 *   competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
 *   monitoringScope: { products: true, pricing: true, marketing: true, talent: true },
 *   stakeholders: ['Strategy', 'Sales', 'Marketing', 'Product']
 * });
 *
 * @references
 * - Strategic and Competitive Intelligence Professionals (SCIP): https://www.scip.org/
 * - Competitive Intelligence Advantage: Seena Sharp
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    competitors = [],
    monitoringScope = {},
    stakeholders = [],
    industryContext = {},
    outputDir = 'competitor-monitoring-output'
  } = inputs;

  // Phase 1: Intelligence Requirements Definition
  const intelligenceRequirements = await ctx.task(intelligenceRequirementsTask, {
    projectName,
    competitors,
    monitoringScope,
    stakeholders
  });

  // Phase 2: Source Identification and Mapping
  const sourcesInventory = await ctx.task(sourcesInventoryTask, {
    projectName,
    competitors,
    intelligenceRequirements,
    industryContext
  });

  // Phase 3: Collection Process Design
  const collectionProcess = await ctx.task(collectionProcessTask, {
    projectName,
    sourcesInventory,
    intelligenceRequirements
  });

  // Phase 4: Analysis Framework Development
  const analysisFramework = await ctx.task(analysisFrameworkTask, {
    projectName,
    competitors,
    intelligenceRequirements,
    monitoringScope
  });

  // Breakpoint: Review monitoring system design
  await ctx.breakpoint({
    question: `Review competitor monitoring system for ${projectName}. Is the scope appropriate?`,
    title: 'Monitoring System Review',
    context: {
      runId: ctx.runId,
      projectName,
      competitorCount: competitors.length,
      sourceCount: sourcesInventory.sources?.length || 0
    }
  });

  // Phase 5: Dissemination Workflow Design
  const disseminationPlan = await ctx.task(disseminationWorkflowTask, {
    projectName,
    stakeholders,
    analysisFramework,
    intelligenceRequirements
  });

  // Phase 6: Technology and Tools Selection
  const toolsSelection = await ctx.task(toolsSelectionTask, {
    projectName,
    collectionProcess,
    analysisFramework,
    disseminationPlan
  });

  // Phase 7: Governance and Ethics Framework
  const governanceFramework = await ctx.task(ciGovernanceTask, {
    projectName,
    collectionProcess,
    industryContext
  });

  // Phase 8: Implementation Plan
  const implementationPlan = await ctx.task(ciImplementationTask, {
    projectName,
    collectionProcess,
    analysisFramework,
    disseminationPlan,
    toolsSelection,
    governanceFramework
  });

  return {
    success: true,
    projectName,
    intelligenceRequirements,
    monitoringSystem: {
      collectionProcess,
      toolsSelection,
      governance: governanceFramework
    },
    sourcesInventory: sourcesInventory.sources,
    analysisFramework,
    disseminationPlan,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/competitor-monitoring-system',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const intelligenceRequirementsTask = defineTask('intelligence-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intelligence Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Intelligence Strategist',
      task: 'Define key intelligence requirements for competitor monitoring',
      context: args,
      instructions: [
        '1. Interview stakeholders to understand intelligence needs',
        '2. Define Key Intelligence Topics (KITs)',
        '3. Create Key Intelligence Questions (KIQs)',
        '4. Prioritize intelligence requirements by impact',
        '5. Define update frequency requirements',
        '6. Map intelligence needs to decision processes',
        '7. Identify early warning indicators',
        '8. Document intelligence success criteria'
      ],
      outputFormat: 'JSON object with intelligence requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['kits', 'kiqs', 'priorities'],
      properties: {
        kits: { type: 'array' },
        kiqs: { type: 'array' },
        priorities: { type: 'array' },
        updateFrequency: { type: 'object' },
        earlyWarnings: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'requirements']
}));

export const sourcesInventoryTask = defineTask('sources-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Source Identification and Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Intelligence Research Specialist',
      task: 'Identify and catalog intelligence sources for competitor monitoring',
      context: args,
      instructions: [
        '1. Identify primary sources (competitor websites, filings, patents)',
        '2. Map secondary sources (news, analysts, industry reports)',
        '3. Identify human intelligence sources (trade shows, networks)',
        '4. Catalog social media and digital footprint sources',
        '5. Assess source reliability and credibility',
        '6. Identify subscription and paid data sources',
        '7. Map sources to intelligence requirements',
        '8. Create source access and cost inventory'
      ],
      outputFormat: 'JSON object with sources inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'sourceMapping', 'reliability'],
      properties: {
        sources: { type: 'array' },
        sourceMapping: { type: 'object' },
        reliability: { type: 'object' },
        costs: { type: 'object' },
        accessRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'sources']
}));

export const collectionProcessTask = defineTask('collection-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collection Process Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Intelligence Collection Specialist',
      task: 'Design systematic collection processes for competitor intelligence',
      context: args,
      instructions: [
        '1. Design automated monitoring workflows',
        '2. Create web scraping and RSS configurations',
        '3. Define alert triggers and notifications',
        '4. Design manual collection procedures',
        '5. Create data capture templates',
        '6. Define collection schedules and cadence',
        '7. Design quality control checkpoints',
        '8. Plan storage and organization systems'
      ],
      outputFormat: 'JSON object with collection process design'
    },
    outputSchema: {
      type: 'object',
      required: ['workflows', 'automation', 'schedules'],
      properties: {
        workflows: { type: 'array' },
        automation: { type: 'object' },
        schedules: { type: 'object' },
        templates: { type: 'array' },
        qualityControl: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'collection']
}));

export const analysisFrameworkTask = defineTask('analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analysis Framework Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Analysis Expert',
      task: 'Develop analysis frameworks for competitor intelligence',
      context: args,
      instructions: [
        '1. Define competitor profiling framework',
        '2. Create SWOT analysis templates',
        '3. Design Porter\'s Five Forces analysis',
        '4. Develop competitive positioning maps',
        '5. Create scenario analysis frameworks',
        '6. Design trend analysis methodologies',
        '7. Define synthesis and insight generation process',
        '8. Create actionable recommendation frameworks'
      ],
      outputFormat: 'JSON object with analysis framework'
    },
    outputSchema: {
      type: 'object',
      required: ['frameworks', 'templates', 'methodologies'],
      properties: {
        frameworks: { type: 'array' },
        templates: { type: 'array' },
        methodologies: { type: 'array' },
        insightGeneration: { type: 'object' },
        recommendationProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'analysis']
}));

export const disseminationWorkflowTask = defineTask('dissemination-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dissemination Workflow Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Intelligence Communications Specialist',
      task: 'Design intelligence dissemination workflows and products',
      context: args,
      instructions: [
        '1. Define intelligence product catalog',
        '2. Design report templates and formats',
        '3. Create alert and notification system',
        '4. Define distribution lists and access controls',
        '5. Design intelligence portal and repository',
        '6. Create briefing and presentation formats',
        '7. Plan push vs pull distribution strategies',
        '8. Design feedback and request mechanisms'
      ],
      outputFormat: 'JSON object with dissemination plan'
    },
    outputSchema: {
      type: 'object',
      required: ['products', 'distribution', 'portal'],
      properties: {
        products: { type: 'array' },
        templates: { type: 'array' },
        distribution: { type: 'object' },
        alerts: { type: 'object' },
        portal: { type: 'object' },
        feedback: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'dissemination']
}));

export const toolsSelectionTask = defineTask('tools-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Technology and Tools Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI Technology Specialist',
      task: 'Select tools and technologies for competitive intelligence',
      context: args,
      instructions: [
        '1. Evaluate CI platforms and tools',
        '2. Select web monitoring and scraping tools',
        '3. Choose social media monitoring solutions',
        '4. Select news and media monitoring services',
        '5. Evaluate analysis and visualization tools',
        '6. Choose knowledge management platform',
        '7. Plan integration architecture',
        '8. Estimate total cost of ownership'
      ],
      outputFormat: 'JSON object with tools selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'integrations', 'costs'],
      properties: {
        selectedTools: { type: 'array' },
        integrations: { type: 'object' },
        architecture: { type: 'object' },
        costs: { type: 'object' },
        implementation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'tools']
}));

export const ciGovernanceTask = defineTask('ci-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance and Ethics Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI Ethics and Governance Specialist',
      task: 'Define governance and ethics framework for competitive intelligence',
      context: args,
      instructions: [
        '1. Define ethical collection guidelines',
        '2. Create legal compliance framework',
        '3. Establish source verification standards',
        '4. Define information classification levels',
        '5. Create access control policies',
        '6. Design audit and compliance monitoring',
        '7. Define training and certification requirements',
        '8. Create incident response procedures'
      ],
      outputFormat: 'JSON object with governance framework'
    },
    outputSchema: {
      type: 'object',
      required: ['ethics', 'compliance', 'policies'],
      properties: {
        ethics: { type: 'object' },
        compliance: { type: 'object' },
        policies: { type: 'array' },
        classification: { type: 'object' },
        training: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'governance']
}));

export const ciImplementationTask = defineTask('ci-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI System Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI Program Manager',
      task: 'Create implementation plan for competitive intelligence system',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create resource requirements',
        '3. Plan tool deployment and configuration',
        '4. Design training program',
        '5. Define pilot and rollout strategy',
        '6. Create success metrics and KPIs',
        '7. Plan ongoing operations and maintenance',
        '8. Define continuous improvement process'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'resources', 'timeline'],
      properties: {
        phases: { type: 'array' },
        resources: { type: 'object' },
        timeline: { type: 'object' },
        training: { type: 'object' },
        metrics: { type: 'array' },
        operations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'competitive-intelligence', 'implementation']
}));
