/**
 * @process specializations/domains/business/supply-chain/risk-monitoring
 * @description Supplier Risk Monitoring and Early Warning - Implement continuous monitoring of supplier
 * risk indicators with automated alerts for financial distress, operational issues, or compliance concerns.
 * @inputs { suppliers?: array, monitoringCriteria?: object, alertThresholds?: object }
 * @outputs { success: boolean, monitoringSetup: object, alerts: array, riskIndicators: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/risk-monitoring', {
 *   suppliers: ['Supplier A', 'Supplier B'],
 *   monitoringCriteria: { financial: true, operational: true, compliance: true },
 *   alertThresholds: { creditScore: 600, otif: 0.90 }
 * });
 *
 * @references
 * - EcoVadis Risk Monitoring: https://ecovadis.com/
 * - Resilinc Supply Chain Risk: https://www.resilinc.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    suppliers = [],
    monitoringCriteria = {},
    alertThresholds = {},
    dataSources = [],
    alertRecipients = [],
    outputDir = 'risk-monitoring-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Supplier Risk Monitoring Setup Process');

  // ============================================================================
  // PHASE 1: MONITORING CRITERIA DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining monitoring criteria');

  const criteriaDefinition = await ctx.task(criteriaDefinitionTask, {
    suppliers,
    monitoringCriteria,
    alertThresholds,
    outputDir
  });

  artifacts.push(...criteriaDefinition.artifacts);

  // ============================================================================
  // PHASE 2: DATA SOURCE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Integrating data sources');

  const dataIntegration = await ctx.task(dataSourceIntegrationTask, {
    dataSources,
    criteriaDefinition,
    outputDir
  });

  artifacts.push(...dataIntegration.artifacts);

  // ============================================================================
  // PHASE 3: FINANCIAL INDICATORS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up financial indicators');

  const financialIndicators = await ctx.task(financialIndicatorsTask, {
    suppliers,
    alertThresholds,
    dataIntegration,
    outputDir
  });

  artifacts.push(...financialIndicators.artifacts);

  // ============================================================================
  // PHASE 4: OPERATIONAL INDICATORS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up operational indicators');

  const operationalIndicators = await ctx.task(operationalIndicatorsTask, {
    suppliers,
    alertThresholds,
    dataIntegration,
    outputDir
  });

  artifacts.push(...operationalIndicators.artifacts);

  // ============================================================================
  // PHASE 5: COMPLIANCE INDICATORS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up compliance indicators');

  const complianceIndicators = await ctx.task(complianceIndicatorsTask, {
    suppliers,
    alertThresholds,
    dataIntegration,
    outputDir
  });

  artifacts.push(...complianceIndicators.artifacts);

  // ============================================================================
  // PHASE 6: ALERT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring alerts');

  const alertConfiguration = await ctx.task(alertConfigurationTask, {
    financialIndicators,
    operationalIndicators,
    complianceIndicators,
    alertThresholds,
    alertRecipients,
    outputDir
  });

  artifacts.push(...alertConfiguration.artifacts);

  // Breakpoint: Review monitoring setup
  await ctx.breakpoint({
    question: `Risk monitoring configured for ${suppliers.length} suppliers. ${alertConfiguration.totalAlerts} alert rules created. Review monitoring setup?`,
    title: 'Risk Monitoring Setup Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        suppliersMonitored: suppliers.length,
        totalAlerts: alertConfiguration.totalAlerts,
        dataSources: dataIntegration.connectedSources
      }
    }
  });

  // ============================================================================
  // PHASE 7: DASHBOARD SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up monitoring dashboard');

  const dashboardSetup = await ctx.task(dashboardSetupTask, {
    suppliers,
    financialIndicators,
    operationalIndicators,
    complianceIndicators,
    outputDir
  });

  artifacts.push(...dashboardSetup.artifacts);

  // ============================================================================
  // PHASE 8: ESCALATION PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining escalation procedures');

  const escalationProcedures = await ctx.task(escalationProceduresTask, {
    alertConfiguration,
    alertRecipients,
    outputDir
  });

  artifacts.push(...escalationProcedures.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    monitoringSetup: {
      suppliersMonitored: suppliers.length,
      dataSources: dataIntegration.connectedSources,
      indicatorCount: criteriaDefinition.indicatorCount
    },
    indicators: {
      financial: financialIndicators.indicators,
      operational: operationalIndicators.indicators,
      compliance: complianceIndicators.indicators
    },
    alerts: alertConfiguration.alertRules,
    dashboard: dashboardSetup.dashboardConfig,
    escalation: escalationProcedures.procedures,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/risk-monitoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const criteriaDefinitionTask = defineTask('criteria-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Monitoring Criteria Definition',
  agent: {
    name: 'criteria-analyst',
    prompt: {
      role: 'Risk Monitoring Analyst',
      task: 'Define risk monitoring criteria and indicators',
      context: args,
      instructions: [
        '1. Define key risk indicators (KRIs)',
        '2. Set thresholds for each indicator',
        '3. Define monitoring frequency',
        '4. Categorize indicators by risk type',
        '5. Weight indicators by importance',
        '6. Define early warning signals',
        '7. Set trigger conditions',
        '8. Document monitoring criteria'
      ],
      outputFormat: 'JSON with monitoring criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'indicatorCount', 'artifacts'],
      properties: {
        indicators: { type: 'array' },
        indicatorCount: { type: 'number' },
        thresholds: { type: 'object' },
        frequencies: { type: 'object' },
        earlyWarnings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'criteria']
}));

export const dataSourceIntegrationTask = defineTask('data-source-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Data Source Integration',
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'Data Integration Specialist',
      task: 'Integrate data sources for risk monitoring',
      context: args,
      instructions: [
        '1. Identify required data sources',
        '2. Configure credit monitoring feeds',
        '3. Integrate news and media monitoring',
        '4. Connect ERP performance data',
        '5. Set up compliance database feeds',
        '6. Configure external risk data feeds',
        '7. Validate data connections',
        '8. Document data sources'
      ],
      outputFormat: 'JSON with data integration status'
    },
    outputSchema: {
      type: 'object',
      required: ['connectedSources', 'dataFeeds', 'artifacts'],
      properties: {
        connectedSources: { type: 'array' },
        dataFeeds: { type: 'object' },
        integrationStatus: { type: 'object' },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'integration']
}));

export const financialIndicatorsTask = defineTask('financial-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Financial Indicators Setup',
  agent: {
    name: 'financial-monitor',
    prompt: {
      role: 'Financial Risk Monitor',
      task: 'Set up financial risk indicators',
      context: args,
      instructions: [
        '1. Configure credit score monitoring',
        '2. Set up payment behavior tracking',
        '3. Monitor financial statement changes',
        '4. Track bankruptcy risk indicators',
        '5. Monitor stock price (if public)',
        '6. Track liens and judgments',
        '7. Set alert thresholds',
        '8. Document financial indicators'
      ],
      outputFormat: 'JSON with financial indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'thresholds', 'artifacts'],
      properties: {
        indicators: { type: 'array' },
        thresholds: { type: 'object' },
        currentStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'financial']
}));

export const operationalIndicatorsTask = defineTask('operational-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Operational Indicators Setup',
  agent: {
    name: 'operational-monitor',
    prompt: {
      role: 'Operational Risk Monitor',
      task: 'Set up operational risk indicators',
      context: args,
      instructions: [
        '1. Configure delivery performance monitoring',
        '2. Set up quality metrics tracking',
        '3. Monitor capacity utilization',
        '4. Track lead time variations',
        '5. Monitor production incidents',
        '6. Track labor/strike risks',
        '7. Set alert thresholds',
        '8. Document operational indicators'
      ],
      outputFormat: 'JSON with operational indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'thresholds', 'artifacts'],
      properties: {
        indicators: { type: 'array' },
        thresholds: { type: 'object' },
        currentStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'operational']
}));

export const complianceIndicatorsTask = defineTask('compliance-indicators', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Compliance Indicators Setup',
  agent: {
    name: 'compliance-monitor',
    prompt: {
      role: 'Compliance Risk Monitor',
      task: 'Set up compliance risk indicators',
      context: args,
      instructions: [
        '1. Configure certification expiry tracking',
        '2. Set up regulatory change monitoring',
        '3. Monitor audit findings',
        '4. Track compliance violations',
        '5. Monitor environmental incidents',
        '6. Track labor compliance issues',
        '7. Set alert thresholds',
        '8. Document compliance indicators'
      ],
      outputFormat: 'JSON with compliance indicators'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'thresholds', 'artifacts'],
      properties: {
        indicators: { type: 'array' },
        thresholds: { type: 'object' },
        currentStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'compliance']
}));

export const alertConfigurationTask = defineTask('alert-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Alert Configuration',
  agent: {
    name: 'alert-configurator',
    prompt: {
      role: 'Alert Configuration Specialist',
      task: 'Configure risk alerts and notifications',
      context: args,
      instructions: [
        '1. Define alert rules for each indicator',
        '2. Configure alert severity levels',
        '3. Set up notification channels (email, SMS)',
        '4. Define alert recipients by type',
        '5. Configure alert escalation',
        '6. Set up alert aggregation',
        '7. Configure alert suppression rules',
        '8. Document alert configuration'
      ],
      outputFormat: 'JSON with alert configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['alertRules', 'totalAlerts', 'artifacts'],
      properties: {
        alertRules: { type: 'array' },
        totalAlerts: { type: 'number' },
        notificationChannels: { type: 'array' },
        escalationRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'alerts']
}));

export const dashboardSetupTask = defineTask('dashboard-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Dashboard Setup',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'Risk Dashboard Designer',
      task: 'Set up risk monitoring dashboard',
      context: args,
      instructions: [
        '1. Design dashboard layout',
        '2. Configure risk heat map widget',
        '3. Set up trend charts',
        '4. Configure alert summary widget',
        '5. Add supplier risk scores',
        '6. Configure drill-down views',
        '7. Set up refresh schedule',
        '8. Document dashboard configuration'
      ],
      outputFormat: 'JSON with dashboard configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardConfig', 'widgets', 'artifacts'],
      properties: {
        dashboardConfig: { type: 'object' },
        widgets: { type: 'array' },
        refreshSchedule: { type: 'object' },
        accessPermissions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'dashboard']
}));

export const escalationProceduresTask = defineTask('escalation-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Escalation Procedures',
  agent: {
    name: 'escalation-planner',
    prompt: {
      role: 'Escalation Procedure Specialist',
      task: 'Define risk escalation procedures',
      context: args,
      instructions: [
        '1. Define escalation levels',
        '2. Set escalation triggers',
        '3. Assign escalation contacts',
        '4. Define response timeframes',
        '5. Create response playbooks',
        '6. Define communication templates',
        '7. Set up escalation tracking',
        '8. Document escalation procedures'
      ],
      outputFormat: 'JSON with escalation procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'escalationLevels', 'artifacts'],
      properties: {
        procedures: { type: 'array' },
        escalationLevels: { type: 'object' },
        contacts: { type: 'object' },
        responsePlaybooks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'risk-monitoring', 'escalation']
}));
