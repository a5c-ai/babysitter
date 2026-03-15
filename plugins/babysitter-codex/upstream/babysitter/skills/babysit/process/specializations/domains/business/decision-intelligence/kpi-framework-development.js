/**
 * @process specializations/domains/business/decision-intelligence/kpi-framework-development
 * @description KPI Framework Development - Systematic definition of key performance indicators aligned with
 * strategic objectives including metric hierarchies, targets, and measurement methodologies.
 * @inputs { projectName: string, strategicObjectives: array, businessUnits: array, existingMetrics?: array, benchmarks?: object }
 * @outputs { success: boolean, kpiFramework: object, metricHierarchies: object, targetingMethodology: object, measurementPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/kpi-framework-development', {
 *   projectName: 'Enterprise KPI Framework',
 *   strategicObjectives: ['Increase Revenue 20%', 'Improve NPS to 70', 'Reduce Churn to 5%'],
 *   businessUnits: ['Sales', 'Marketing', 'Customer Success', 'Product']
 * });
 *
 * @references
 * - Balanced Scorecard: https://hbr.org/1992/01/the-balanced-scorecard-measures-that-drive-performance-2
 * - OKRs: https://www.whatmatters.com/
 * - Key Performance Indicators: David Parmenter
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    strategicObjectives = [],
    businessUnits = [],
    existingMetrics = [],
    benchmarks = {},
    outputDir = 'kpi-framework-output'
  } = inputs;

  // Phase 1: Strategic Alignment Analysis
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    projectName,
    strategicObjectives,
    businessUnits,
    existingMetrics
  });

  // Phase 2: KPI Identification and Definition
  const kpiDefinitions = await ctx.task(kpiDefinitionTask, {
    projectName,
    strategicAlignment,
    businessUnits,
    existingMetrics
  });

  // Phase 3: Metric Hierarchy Design
  const metricHierarchies = await ctx.task(metricHierarchyTask, {
    projectName,
    kpiDefinitions,
    businessUnits,
    strategicObjectives
  });

  // Breakpoint: Review KPI definitions
  await ctx.breakpoint({
    question: `Review KPI definitions and hierarchies for ${projectName}. Are all strategic objectives covered?`,
    title: 'KPI Framework Review',
    context: {
      runId: ctx.runId,
      projectName,
      kpiCount: kpiDefinitions.kpis?.length || 0,
      hierarchyLevels: metricHierarchies.levels?.length || 0
    }
  });

  // Phase 4: Target Setting Methodology
  const targetMethodology = await ctx.task(targetMethodologyTask, {
    projectName,
    kpiDefinitions,
    benchmarks,
    strategicObjectives
  });

  // Phase 5: Measurement System Design
  const measurementSystem = await ctx.task(measurementSystemTask, {
    projectName,
    kpiDefinitions,
    metricHierarchies,
    targetMethodology
  });

  // Phase 6: Data Source Mapping
  const dataSourceMapping = await ctx.task(dataSourceMappingTask, {
    projectName,
    kpiDefinitions,
    measurementSystem
  });

  // Phase 7: Governance and Ownership
  const governanceModel = await ctx.task(governanceModelTask, {
    projectName,
    kpiDefinitions,
    businessUnits,
    metricHierarchies
  });

  // Phase 8: Implementation Plan
  const implementationPlan = await ctx.task(kpiImplementationTask, {
    projectName,
    kpiDefinitions,
    measurementSystem,
    dataSourceMapping,
    governanceModel
  });

  return {
    success: true,
    projectName,
    strategicAlignment,
    kpiFramework: kpiDefinitions,
    metricHierarchies,
    targetingMethodology: targetMethodology,
    measurementPlan: measurementSystem,
    dataSourceMapping,
    governanceModel,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/kpi-framework-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Alignment Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategy and Performance Management Consultant',
      task: 'Analyze strategic objectives and define KPI alignment requirements',
      context: args,
      instructions: [
        '1. Decompose strategic objectives into measurable outcomes',
        '2. Identify cause-effect relationships between objectives',
        '3. Map objectives to balanced scorecard perspectives',
        '4. Identify leading and lagging indicator requirements',
        '5. Assess current metric coverage gaps',
        '6. Define critical success factors for each objective',
        '7. Identify cross-functional dependencies',
        '8. Prioritize objectives for KPI development'
      ],
      outputFormat: 'JSON object with strategic alignment analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['objectiveMapping', 'causality', 'priorities'],
      properties: {
        objectiveMapping: { type: 'array' },
        causality: { type: 'object' },
        perspectives: { type: 'object' },
        gaps: { type: 'array' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'strategy']
}));

export const kpiDefinitionTask = defineTask('kpi-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `KPI Identification and Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'KPI Design and Metrics Expert',
      task: 'Define comprehensive KPIs aligned with strategic objectives',
      context: args,
      instructions: [
        '1. Define KPIs using SMART criteria',
        '2. Specify calculation formulas and data elements',
        '3. Define measurement frequency and reporting cycle',
        '4. Identify data owners and stewards',
        '5. Specify units of measure and formatting',
        '6. Define polarity (higher is better vs lower is better)',
        '7. Document business context and interpretation',
        '8. Identify potential gaming risks and mitigations'
      ],
      outputFormat: 'JSON object with KPI definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'formulas', 'dataRequirements'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              formula: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' },
              polarity: { type: 'string' }
            }
          }
        },
        formulas: { type: 'object' },
        dataRequirements: { type: 'array' },
        gamingRisks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'definition']
}));

export const metricHierarchyTask = defineTask('metric-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metric Hierarchy Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Measurement Architect',
      task: 'Design metric hierarchies linking operational to strategic metrics',
      context: args,
      instructions: [
        '1. Define metric hierarchy levels (strategic, tactical, operational)',
        '2. Create roll-up and drill-down relationships',
        '3. Map metrics to organizational structure',
        '4. Define aggregation rules and calculations',
        '5. Identify cross-cutting metrics and dimensions',
        '6. Design decomposition trees for root cause analysis',
        '7. Define metric interdependencies and correlations',
        '8. Create visual hierarchy documentation'
      ],
      outputFormat: 'JSON object with metric hierarchies'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'relationships', 'aggregationRules'],
      properties: {
        levels: { type: 'array' },
        relationships: { type: 'array' },
        aggregationRules: { type: 'object' },
        decompositionTrees: { type: 'array' },
        dependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'hierarchy']
}));

export const targetMethodologyTask = defineTask('target-methodology', (args, taskCtx) => ({
  kind: 'agent',
  title: `Target Setting Methodology - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Target Setting Specialist',
      task: 'Define methodology for setting KPI targets and thresholds',
      context: args,
      instructions: [
        '1. Select target-setting approaches (benchmarking, historical, aspirational)',
        '2. Define threshold levels (red, yellow, green)',
        '3. Establish baseline measurement process',
        '4. Create target cascading methodology',
        '5. Define stretch target calculations',
        '6. Plan target review and adjustment cycles',
        '7. Design incentive alignment considerations',
        '8. Document target rationale and assumptions'
      ],
      outputFormat: 'JSON object with target methodology'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'thresholds', 'cascading'],
      properties: {
        methodology: { type: 'object' },
        thresholds: { type: 'object' },
        cascading: { type: 'object' },
        reviewCycle: { type: 'object' },
        assumptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'targets']
}));

export const measurementSystemTask = defineTask('measurement-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Measurement System Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Measurement Systems Engineer',
      task: 'Design comprehensive measurement system for KPI tracking',
      context: args,
      instructions: [
        '1. Define data collection processes',
        '2. Design automated calculation pipelines',
        '3. Specify data validation and quality checks',
        '4. Define measurement timing and cutoffs',
        '5. Design exception handling procedures',
        '6. Plan audit trail and lineage tracking',
        '7. Define manual adjustment protocols',
        '8. Design measurement accuracy monitoring'
      ],
      outputFormat: 'JSON object with measurement system design'
    },
    outputSchema: {
      type: 'object',
      required: ['processes', 'pipelines', 'validation'],
      properties: {
        processes: { type: 'array' },
        pipelines: { type: 'array' },
        validation: { type: 'object' },
        timing: { type: 'object' },
        auditTrail: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'measurement']
}));

export const dataSourceMappingTask = defineTask('data-source-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Source Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Integration Architect',
      task: 'Map KPIs to data sources and define integration requirements',
      context: args,
      instructions: [
        '1. Identify data sources for each KPI component',
        '2. Define data extraction requirements',
        '3. Map data lineage from source to metric',
        '4. Identify data quality dependencies',
        '5. Define integration architecture',
        '6. Plan data refresh schedules',
        '7. Document data transformation logic',
        '8. Identify data gaps requiring new collection'
      ],
      outputFormat: 'JSON object with data source mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceMapping', 'integrations', 'lineage'],
      properties: {
        sourceMapping: { type: 'object' },
        integrations: { type: 'array' },
        lineage: { type: 'object' },
        transformations: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'data-mapping']
}));

export const governanceModelTask = defineTask('governance-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance and Ownership Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'KPI Governance Specialist',
      task: 'Define governance model for KPI ownership and management',
      context: args,
      instructions: [
        '1. Define KPI ownership roles and responsibilities',
        '2. Establish metric definition change control process',
        '3. Create performance review governance',
        '4. Define escalation and exception procedures',
        '5. Plan regular governance review cycles',
        '6. Design communication and reporting protocols',
        '7. Define data quality accountability',
        '8. Create governance documentation standards'
      ],
      outputFormat: 'JSON object with governance model'
    },
    outputSchema: {
      type: 'object',
      required: ['ownership', 'processes', 'reviews'],
      properties: {
        ownership: { type: 'object' },
        processes: { type: 'array' },
        reviews: { type: 'object' },
        escalation: { type: 'object' },
        documentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'governance']
}));

export const kpiImplementationTask = defineTask('kpi-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `KPI Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'KPI Implementation Project Manager',
      task: 'Create detailed implementation plan for KPI framework',
      context: args,
      instructions: [
        '1. Define implementation phases and priorities',
        '2. Create detailed work breakdown structure',
        '3. Identify resource and skill requirements',
        '4. Plan system and tool implementation',
        '5. Design training and change management',
        '6. Define pilot and rollout strategy',
        '7. Create risk mitigation plans',
        '8. Define success criteria and go-live checklist'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        training: { type: 'object' },
        risks: { type: 'array' },
        successCriteria: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'implementation']
}));
