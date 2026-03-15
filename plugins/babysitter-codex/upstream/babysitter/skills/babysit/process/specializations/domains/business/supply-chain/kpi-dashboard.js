/**
 * @process specializations/domains/business/supply-chain/kpi-dashboard
 * @description Supply Chain KPI Dashboard Development - Design and implement executive dashboards tracking
 * key supply chain metrics across plan, source, make, deliver, and return processes aligned with SCOR model.
 * @inputs { scorProcesses?: array, metricsScope?: object, stakeholders?: array, dataSource?: object }
 * @outputs { success: boolean, dashboardDesign: object, kpiDefinitions: array, implementation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/kpi-dashboard', {
 *   scorProcesses: ['plan', 'source', 'make', 'deliver', 'return'],
 *   metricsScope: { levels: ['strategic', 'tactical', 'operational'] },
 *   stakeholders: ['executive', 'operations', 'finance']
 * });
 *
 * @references
 * - ASCM SCOR Model: https://www.ascm.org/topics/scor/
 * - Supply Chain KPI Best Practices: https://www.gartner.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    scorProcesses = ['plan', 'source', 'make', 'deliver', 'return'],
    metricsScope = {},
    stakeholders = [],
    dataSource = {},
    refreshFrequency = 'daily',
    outputDir = 'kpi-dashboard-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Supply Chain KPI Dashboard Development Process');

  // ============================================================================
  // PHASE 1: STAKEHOLDER REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering stakeholder requirements');

  const stakeholderRequirements = await ctx.task(stakeholderRequirementsTask, {
    stakeholders,
    metricsScope,
    outputDir
  });

  artifacts.push(...stakeholderRequirements.artifacts);

  // ============================================================================
  // PHASE 2: KPI DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining supply chain KPIs');

  const kpiDefinition = await ctx.task(kpiDefinitionTask, {
    scorProcesses,
    stakeholderRequirements,
    metricsScope,
    outputDir
  });

  artifacts.push(...kpiDefinition.artifacts);

  // ============================================================================
  // PHASE 3: DATA SOURCE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping data sources');

  const dataSourceMapping = await ctx.task(dataSourceMappingTask, {
    kpiDefinition,
    dataSource,
    outputDir
  });

  artifacts.push(...dataSourceMapping.artifacts);

  // ============================================================================
  // PHASE 4: DASHBOARD DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing dashboard layout');

  const dashboardDesign = await ctx.task(dashboardDesignTask, {
    kpiDefinition,
    stakeholderRequirements,
    dataSourceMapping,
    outputDir
  });

  artifacts.push(...dashboardDesign.artifacts);

  // Breakpoint: Review dashboard design
  await ctx.breakpoint({
    question: `Dashboard design complete. ${kpiDefinition.totalKpis} KPIs defined across ${scorProcesses.length} SCOR processes. Review dashboard design before implementation?`,
    title: 'Dashboard Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        totalKpis: kpiDefinition.totalKpis,
        scorProcesses,
        dashboardViews: dashboardDesign.views.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: BENCHMARK AND TARGET SETTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting benchmarks and targets');

  const benchmarkTargets = await ctx.task(benchmarkTargetsTask, {
    kpiDefinition,
    outputDir
  });

  artifacts.push(...benchmarkTargets.artifacts);

  // ============================================================================
  // PHASE 6: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning implementation');

  const implementationPlan = await ctx.task(implementationPlanTask, {
    dashboardDesign,
    dataSourceMapping,
    benchmarkTargets,
    refreshFrequency,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating documentation');

  const documentation = await ctx.task(kpiDocumentationTask, {
    kpiDefinition,
    dashboardDesign,
    benchmarkTargets,
    implementationPlan,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dashboardDesign: {
      views: dashboardDesign.views,
      layout: dashboardDesign.layout,
      drillDowns: dashboardDesign.drillDowns
    },
    kpiDefinitions: kpiDefinition.kpis,
    kpisByProcess: kpiDefinition.kpisByProcess,
    benchmarks: benchmarkTargets.benchmarks,
    targets: benchmarkTargets.targets,
    implementation: {
      timeline: implementationPlan.timeline,
      dataConnections: dataSourceMapping.connections,
      refreshSchedule: implementationPlan.refreshSchedule
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/kpi-dashboard',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const stakeholderRequirementsTask = defineTask('stakeholder-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Stakeholder Requirements',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'Dashboard Requirements Analyst',
      task: 'Gather stakeholder requirements for KPI dashboard',
      context: args,
      instructions: [
        '1. Identify dashboard stakeholders',
        '2. Document information needs by role',
        '3. Define decision-making requirements',
        '4. Identify key questions to answer',
        '5. Define alert and exception needs',
        '6. Document drill-down requirements',
        '7. Define reporting frequency needs',
        '8. Document requirements specification'
      ],
      outputFormat: 'JSON with stakeholder requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'stakeholderNeeds', 'artifacts'],
      properties: {
        requirements: { type: 'array' },
        stakeholderNeeds: { type: 'object' },
        keyQuestions: { type: 'array' },
        alertNeeds: { type: 'array' },
        drillDownNeeds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'requirements']
}));

export const kpiDefinitionTask = defineTask('kpi-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: KPI Definition',
  agent: {
    name: 'kpi-analyst',
    prompt: {
      role: 'KPI Definition Specialist',
      task: 'Define supply chain KPIs aligned with SCOR',
      context: args,
      instructions: [
        '1. Define Plan metrics (forecast accuracy, inventory days)',
        '2. Define Source metrics (supplier performance, cost)',
        '3. Define Make metrics (throughput, quality, OEE)',
        '4. Define Deliver metrics (OTIF, lead time, fill rate)',
        '5. Define Return metrics (return rate, disposition)',
        '6. Define calculation formulas',
        '7. Classify by level (strategic/tactical/operational)',
        '8. Document KPI definitions'
      ],
      outputFormat: 'JSON with KPI definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'kpisByProcess', 'totalKpis', 'artifacts'],
      properties: {
        kpis: { type: 'array' },
        kpisByProcess: { type: 'object' },
        totalKpis: { type: 'number' },
        formulas: { type: 'object' },
        hierarchy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'definition']
}));

export const dataSourceMappingTask = defineTask('data-source-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Data Source Mapping',
  agent: {
    name: 'data-mapper',
    prompt: {
      role: 'Data Integration Specialist',
      task: 'Map data sources to KPIs',
      context: args,
      instructions: [
        '1. Identify data sources for each KPI',
        '2. Map source systems (ERP, WMS, TMS)',
        '3. Define data extraction requirements',
        '4. Identify data transformations needed',
        '5. Define refresh frequency by KPI',
        '6. Identify data quality issues',
        '7. Create data lineage documentation',
        '8. Document data source mapping'
      ],
      outputFormat: 'JSON with data source mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['connections', 'dataMap', 'artifacts'],
      properties: {
        connections: { type: 'array' },
        dataMap: { type: 'object' },
        transformations: { type: 'array' },
        refreshRequirements: { type: 'object' },
        dataQualityIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'data-mapping']
}));

export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Dashboard Design',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'Dashboard UX Designer',
      task: 'Design KPI dashboard layout and visualization',
      context: args,
      instructions: [
        '1. Design executive summary view',
        '2. Design process-specific views (Plan, Source, etc.)',
        '3. Select visualization types for each KPI',
        '4. Design drill-down navigation',
        '5. Configure alert indicators',
        '6. Design mobile-friendly views',
        '7. Create dashboard wireframes',
        '8. Document design specifications'
      ],
      outputFormat: 'JSON with dashboard design'
    },
    outputSchema: {
      type: 'object',
      required: ['views', 'layout', 'drillDowns', 'artifacts'],
      properties: {
        views: { type: 'array' },
        layout: { type: 'object' },
        visualizations: { type: 'object' },
        drillDowns: { type: 'array' },
        alertConfig: { type: 'object' },
        wireframes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'design']
}));

export const benchmarkTargetsTask = defineTask('benchmark-targets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Benchmark and Target Setting',
  agent: {
    name: 'benchmark-analyst',
    prompt: {
      role: 'Performance Benchmark Analyst',
      task: 'Set benchmarks and targets for KPIs',
      context: args,
      instructions: [
        '1. Research industry benchmarks',
        '2. Establish baseline performance',
        '3. Set target values for each KPI',
        '4. Define red/yellow/green thresholds',
        '5. Set improvement trajectories',
        '6. Align with strategic objectives',
        '7. Define stretch goals',
        '8. Document benchmarks and targets'
      ],
      outputFormat: 'JSON with benchmarks and targets'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarks', 'targets', 'artifacts'],
      properties: {
        benchmarks: { type: 'object' },
        targets: { type: 'object' },
        thresholds: { type: 'object' },
        baselines: { type: 'object' },
        improvementTrajectories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'benchmarks']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Implementation Planning',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Dashboard Implementation Planner',
      task: 'Plan dashboard implementation',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create project timeline',
        '3. Identify resource requirements',
        '4. Define data integration tasks',
        '5. Plan user training',
        '6. Define refresh schedule',
        '7. Plan rollout approach',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'refreshSchedule', 'artifacts'],
      properties: {
        timeline: { type: 'object' },
        phases: { type: 'array' },
        resourceRequirements: { type: 'object' },
        integrationTasks: { type: 'array' },
        trainingPlan: { type: 'object' },
        refreshSchedule: { type: 'object' },
        rolloutPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'implementation']
}));

export const kpiDocumentationTask = defineTask('kpi-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: KPI Documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'KPI Documentation Specialist',
      task: 'Create comprehensive KPI documentation',
      context: args,
      instructions: [
        '1. Create KPI dictionary',
        '2. Document calculation methodology',
        '3. Create user guide',
        '4. Document data sources',
        '5. Create interpretation guidelines',
        '6. Document maintenance procedures',
        '7. Create FAQ document',
        '8. Compile documentation package'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['kpiDictionary', 'userGuide', 'artifacts'],
      properties: {
        kpiDictionary: { type: 'object' },
        userGuide: { type: 'object' },
        methodology: { type: 'object' },
        interpretationGuide: { type: 'object' },
        maintenanceProcedures: { type: 'object' },
        faq: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'kpi-dashboard', 'documentation']
}));
