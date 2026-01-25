/**
 * @process chemical-engineering/energy-efficiency-optimization
 * @description Analyze and optimize process energy consumption, implement energy management systems, and evaluate renewable integration
 * @inputs { processName: string, energyData: object, utilityData: object, processData: object, outputDir: string }
 * @outputs { success: boolean, auditResults: object, optimizationPlan: object, kpiDashboard: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    energyData,
    utilityData,
    processData,
    renewableOptions = {},
    outputDir = 'energy-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Conduct Energy Audit
  ctx.log('info', 'Starting energy optimization: Conducting energy audit');
  const auditResult = await ctx.task(energyAuditTask, {
    processName,
    energyData,
    utilityData,
    processData,
    outputDir
  });

  if (!auditResult.success) {
    return {
      success: false,
      error: 'Energy audit failed',
      details: auditResult,
      metadata: { processId: 'chemical-engineering/energy-efficiency-optimization', timestamp: startTime }
    };
  }

  artifacts.push(...auditResult.artifacts);

  // Task 2: Identify Energy Consumption by Unit Operation
  ctx.log('info', 'Identifying energy consumption by unit operation');
  const consumptionResult = await ctx.task(energyConsumptionAnalysisTask, {
    processName,
    auditData: auditResult.auditData,
    processData,
    outputDir
  });

  artifacts.push(...consumptionResult.artifacts);

  // Task 3: Apply Pinch Analysis and Heat Integration
  ctx.log('info', 'Applying pinch analysis and heat integration');
  const pinchResult = await ctx.task(pinchAnalysisTask, {
    processName,
    energyConsumption: consumptionResult.consumption,
    processData,
    outputDir
  });

  artifacts.push(...pinchResult.artifacts);

  // Task 4: Evaluate Efficiency Improvements
  ctx.log('info', 'Evaluating efficiency improvements');
  const efficiencyResult = await ctx.task(efficiencyImprovementsTask, {
    processName,
    energyConsumption: consumptionResult.consumption,
    pinchAnalysis: pinchResult.analysis,
    outputDir
  });

  artifacts.push(...efficiencyResult.artifacts);

  // Task 5: Assess Renewable Energy Integration
  ctx.log('info', 'Assessing renewable energy integration');
  const renewableResult = await ctx.task(renewableIntegrationTask, {
    processName,
    energyConsumption: consumptionResult.consumption,
    renewableOptions,
    utilityData,
    outputDir
  });

  artifacts.push(...renewableResult.artifacts);

  // Breakpoint: Review energy optimization analysis
  await ctx.breakpoint({
    question: `Energy optimization analysis complete for ${processName}. Current consumption: ${consumptionResult.totalEnergy} GJ/year. Potential savings: ${efficiencyResult.totalSavings}%. Renewable potential: ${renewableResult.renewablePotential}%. Review analysis?`,
    title: 'Energy Efficiency Optimization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        currentConsumption: consumptionResult.totalEnergy,
        heatIntegrationSavings: pinchResult.analysis.energySavings,
        efficiencySavings: efficiencyResult.totalSavings,
        renewablePotential: renewableResult.renewablePotential
      }
    }
  });

  // Task 6: Develop Energy Management Plan
  ctx.log('info', 'Developing energy management plan');
  const managementPlanResult = await ctx.task(energyManagementPlanTask, {
    processName,
    efficiencyImprovements: efficiencyResult.improvements,
    renewableIntegration: renewableResult.options,
    heatIntegration: pinchResult.analysis,
    outputDir
  });

  artifacts.push(...managementPlanResult.artifacts);

  // Task 7: Define Energy Management KPIs
  ctx.log('info', 'Defining energy management KPIs');
  const kpiResult = await ctx.task(energyKpiTask, {
    processName,
    baseline: consumptionResult.consumption,
    targetImprovements: efficiencyResult.improvements,
    outputDir
  });

  artifacts.push(...kpiResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    auditResults: auditResult.auditData,
    optimizationPlan: {
      efficiencyImprovements: efficiencyResult.improvements,
      heatIntegration: pinchResult.analysis,
      renewableIntegration: renewableResult.options,
      managementPlan: managementPlanResult.plan
    },
    kpiDashboard: kpiResult.dashboard,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/energy-efficiency-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Energy Audit
export const energyAuditTask = defineTask('energy-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct energy audit',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'energy auditor',
      task: 'Conduct comprehensive energy audit of process',
      context: args,
      instructions: [
        'Review utility bills and consumption data',
        'Inventory all energy-consuming equipment',
        'Measure actual energy consumption',
        'Identify energy metering gaps',
        'Benchmark against industry standards',
        'Identify obvious energy waste',
        'Calculate energy intensity metrics',
        'Document audit findings'
      ],
      outputFormat: 'JSON with audit data, findings, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'auditData', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        auditData: {
          type: 'object',
          properties: {
            totalConsumption: { type: 'number' },
            byUtility: { type: 'object' },
            equipmentInventory: { type: 'array' },
            benchmarks: { type: 'object' }
          }
        },
        findings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'audit']
}));

// Task 2: Energy Consumption Analysis
export const energyConsumptionAnalysisTask = defineTask('energy-consumption-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify energy consumption by unit operation',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'energy consumption analyst',
      task: 'Analyze energy consumption by unit operation',
      context: args,
      instructions: [
        'Break down consumption by process unit',
        'Identify electricity consumers',
        'Identify steam/heat consumers',
        'Identify cooling requirements',
        'Calculate specific energy consumption per unit',
        'Identify largest energy consumers',
        'Create energy Sankey diagram',
        'Document consumption analysis'
      ],
      outputFormat: 'JSON with consumption breakdown, largest consumers, Sankey data, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'consumption', 'totalEnergy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        consumption: {
          type: 'object',
          properties: {
            byUnit: { type: 'array' },
            byType: { type: 'object' },
            largestConsumers: { type: 'array' }
          }
        },
        totalEnergy: { type: 'number' },
        sankeyData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'consumption']
}));

// Task 3: Pinch Analysis
export const pinchAnalysisTask = defineTask('pinch-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply pinch analysis and heat integration',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'heat integration engineer',
      task: 'Apply pinch analysis for heat integration opportunities',
      context: args,
      instructions: [
        'Extract hot and cold stream data',
        'Construct composite curves',
        'Identify pinch point',
        'Calculate minimum utility targets',
        'Design heat exchanger network',
        'Identify process modifications for integration',
        'Calculate potential energy savings',
        'Document pinch analysis'
      ],
      outputFormat: 'JSON with pinch analysis, utility targets, network design, savings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            pinchTemperature: { type: 'number' },
            minimumHotUtility: { type: 'number' },
            minimumColdUtility: { type: 'number' },
            currentUtility: { type: 'number' },
            energySavings: { type: 'number' },
            henDesign: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'pinch-analysis']
}));

// Task 4: Efficiency Improvements
export const efficiencyImprovementsTask = defineTask('efficiency-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate efficiency improvements',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'energy efficiency engineer',
      task: 'Identify and evaluate efficiency improvement opportunities',
      context: args,
      instructions: [
        'Identify motor efficiency upgrades',
        'Evaluate VFD installation opportunities',
        'Assess pump and compressor efficiency',
        'Evaluate steam trap maintenance',
        'Identify insulation improvements',
        'Assess lighting upgrades',
        'Evaluate compressed air system',
        'Quantify savings for each improvement'
      ],
      outputFormat: 'JSON with improvements, savings potential, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'improvements', 'totalSavings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              area: { type: 'string' },
              savings: { type: 'number' },
              cost: { type: 'number' },
              payback: { type: 'number' }
            }
          }
        },
        totalSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'improvements']
}));

// Task 5: Renewable Integration
export const renewableIntegrationTask = defineTask('renewable-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess renewable energy integration',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'renewable energy integration engineer',
      task: 'Assess options for renewable energy integration',
      context: args,
      instructions: [
        'Evaluate solar PV potential',
        'Assess solar thermal potential',
        'Evaluate biomass/biogas options',
        'Assess wind energy potential',
        'Evaluate waste heat to power',
        'Consider power purchase agreements',
        'Calculate renewable fraction achievable',
        'Document renewable options'
      ],
      outputFormat: 'JSON with renewable options, potential, economics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'options', 'renewablePotential', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              capacity: { type: 'number' },
              contribution: { type: 'number' },
              cost: { type: 'number' },
              payback: { type: 'number' }
            }
          }
        },
        renewablePotential: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'renewables']
}));

// Task 6: Energy Management Plan
export const energyManagementPlanTask = defineTask('energy-management-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop energy management plan',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'energy management planner',
      task: 'Develop comprehensive energy management plan',
      context: args,
      instructions: [
        'Prioritize improvement opportunities',
        'Develop implementation timeline',
        'Define energy reduction targets',
        'Assign responsibilities',
        'Plan energy monitoring system',
        'Design energy awareness program',
        'Plan ISO 50001 alignment',
        'Create energy management plan'
      ],
      outputFormat: 'JSON with energy management plan, targets, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            targets: { type: 'object' },
            actions: { type: 'array' },
            timeline: { type: 'object' },
            responsibilities: { type: 'object' },
            monitoring: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'management']
}));

// Task 7: Energy KPIs
export const energyKpiTask = defineTask('energy-kpi', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define energy management KPIs',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'energy KPI developer',
      task: 'Define KPIs for energy management tracking',
      context: args,
      instructions: [
        'Define specific energy consumption KPIs',
        'Define energy intensity metrics',
        'Set baseline and targets',
        'Define reporting frequency',
        'Design KPI dashboard',
        'Define alert thresholds',
        'Plan KPI communication',
        'Create KPI documentation'
      ],
      outputFormat: 'JSON with KPI definitions, dashboard design, targets, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboard', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboard: {
          type: 'object',
          properties: {
            kpis: { type: 'array' },
            baseline: { type: 'object' },
            targets: { type: 'object' },
            alerts: { type: 'array' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'energy-efficiency', 'kpis']
}));
