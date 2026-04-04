/**
 * MIT License
 *
 * Copyright (c) 2026 Babysitter SDK Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @process cloud-chaos-monkey
 * @description Cloud-agnostic chaos monkey process for any cloud provider.
 *   Discovers services, plans shadow environments, provisions chaos clones,
 *   generates and executes chaos scenarios across 4 fault domains, scores
 *   resilience across 5 dimensions (0-100), and produces an interactive HTML report.
 *   Works with GCP, AWS, Azure, or custom providers via provider-aware agent prompts.
 *
 * @inputs {
 *   provider: string           — cloud provider: 'gcp' | 'aws' | 'azure' | 'custom'
 *   projectIdentifier: string  — project ID (GCP), account ID (AWS), subscription ID (Azure)
 *   region: string             — primary deployment region
 *   chaosPrefix: string        — prefix for shadow resources (default: 'chaos')
 *   faultDomains: string[]     — fault domains to test (default: all 4)
 *   executionMode: string      — 'hybrid' | 'automated' | 'manual' (default: 'hybrid')
 *   safetyControls: object     — { autoAbort, maxErrorRatePercent, rollbackTimeoutSeconds }
 *   healthCheckConfig: object  — { sampleCount, timeoutSeconds }
 *   reportOutputPath: string   — path for HTML report (default: 'docs/chaos-report.html')
 *   reportTheme: string        — 'dark' | 'light' (default: 'dark')
 * }
 * @outputs {
 *   success: boolean,
 *   phasesExecuted: string[],
 *   discovery: object,
 *   selectedComponents: object,
 *   shadowPlan: object,
 *   costEstimate: object,
 *   shadowEnv: object,
 *   scenarios: object,
 *   selectedScenarios: object,
 *   baseline: object,
 *   chaosResults: array,
 *   analysis: object,
 *   report: object,
 *   teardown: object,
 *   resilienceScore: number,
 *   metadata: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ═════════════════════════════════════════════════════════════════════════════
// PROVIDER CLI MAPPING (used in agent prompt context, never executed directly)
// ═════════════════════════════════════════════════════════════════════════════

const PROVIDER_HINTS = {
  gcp: {
    cli: 'gcloud',
    containerService: 'Cloud Run',
    serverlessFunction: 'Cloud Functions',
    database: 'Firestore / Cloud SQL',
    logging: 'Cloud Logging',
    identityLabel: 'project',
  },
  aws: {
    cli: 'aws',
    containerService: 'ECS / Fargate',
    serverlessFunction: 'Lambda',
    database: 'DynamoDB / RDS',
    logging: 'CloudWatch Logs',
    identityLabel: 'account',
  },
  azure: {
    cli: 'az',
    containerService: 'Container Apps / ACI',
    serverlessFunction: 'Azure Functions',
    database: 'CosmosDB / SQL Database',
    logging: 'Azure Monitor',
    identityLabel: 'subscription',
  },
  custom: {
    cli: 'provider-specific',
    containerService: 'container-service',
    serverlessFunction: 'serverless-function',
    database: 'database',
    logging: 'logging-service',
    identityLabel: 'identifier',
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PROCESS
// ═════════════════════════════════════════════════════════════════════════════

export async function process(inputs, ctx) {
  const {
    provider = 'gcp',
    projectIdentifier,
    region,
    chaosPrefix = 'chaos',
    faultDomains = ['service-crashes', 'network-latency', 'data-layer', 'external-apis'],
    executionMode = 'hybrid',
    safetyControls = {
      autoAbort: true,
      maxErrorRatePercent: 50,
      rollbackTimeoutSeconds: 120,
    },
    healthCheckConfig = {
      sampleCount: 5,
      timeoutSeconds: 10,
    },
    reportOutputPath = 'docs/chaos-report.html',
    reportTheme = 'dark',
  } = inputs;

  const hints = PROVIDER_HINTS[provider] || PROVIDER_HINTS.custom;

  const output = {
    success: false,
    phasesExecuted: [],
    discovery: null,
    selectedComponents: null,
    shadowPlan: null,
    costEstimate: null,
    shadowEnv: null,
    scenarios: null,
    selectedScenarios: null,
    baseline: null,
    chaosResults: [],
    analysis: null,
    report: null,
    teardown: null,
    resilienceScore: 0,
    metadata: {
      processId: 'cloud-chaos-monkey',
      provider,
      projectIdentifier,
      region,
      startedAt: ctx.now(),
      completedAt: null,
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: System Discovery
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 1: Discovering services, dependencies, and architecture...');

  const discoveryResult = await ctx.task(systemDiscoveryTask, {
    provider,
    projectIdentifier,
    region,
    hints,
  });
  output.discovery = discoveryResult;
  output.phasesExecuted.push('system-discovery');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Component Selection (breakpoint)
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 2: Presenting discovered components for selection...');

  await ctx.breakpoint({
    question: `Discovered ${discoveryResult.serviceCount || 'N'} services in `
      + `${provider.toUpperCase()} ${hints.identityLabel} "${projectIdentifier}" (${region}):\n\n`
      + `${discoveryResult.summary || 'Review the discovered services.'}\n\n`
      + 'Select which components to include in chaos testing.\n'
      + 'Respond with component IDs (e.g. "C1,C3,C5") or "all".',
    title: 'Component Selection for Chaos Testing',
    context: {
      runId: ctx.runId,
      provider,
      serviceCount: discoveryResult.serviceCount,
      services: discoveryResult.services,
    },
  });

  const componentSelectionResult = await ctx.task(processComponentSelectionTask, {
    provider,
    discovery: discoveryResult,
  });
  output.selectedComponents = componentSelectionResult;
  output.phasesExecuted.push('component-selection');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Shadow Environment Planning
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 3: Planning shadow environment with chaos-prefixed clones...');

  const shadowPlanResult = await ctx.task(planShadowEnvironmentTask, {
    provider,
    projectIdentifier,
    region,
    chaosPrefix,
    hints,
    selectedComponents: componentSelectionResult,
    discovery: discoveryResult,
  });
  output.shadowPlan = shadowPlanResult;
  output.phasesExecuted.push('shadow-planning');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Cost Estimation (breakpoint)
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 4: Estimating cloud cost for shadow environment...');

  const costResult = await ctx.task(estimateCostTask, {
    provider,
    projectIdentifier,
    region,
    hints,
    shadowPlan: shadowPlanResult,
  });
  output.costEstimate = costResult;
  output.phasesExecuted.push('cost-estimation');

  await ctx.breakpoint({
    question: `Shadow environment cost estimate for ${provider.toUpperCase()}:\n\n`
      + `${costResult.summary || 'Review cost breakdown.'}\n\n`
      + `Estimated total: ${costResult.estimatedTotalUsd || 'N/A'} USD\n`
      + `Duration: ${costResult.estimatedDurationHours || 'N/A'} hours\n\n`
      + 'Approve to proceed with provisioning, or adjust the scope.',
    title: 'Cost Estimation — Approve Shadow Environment',
    context: {
      runId: ctx.runId,
      estimatedTotalUsd: costResult.estimatedTotalUsd,
      estimatedDurationHours: costResult.estimatedDurationHours,
      costBreakdown: costResult.costBreakdown,
    },
  });

  await ctx.breakpoint({
    question: `Provisioning plan for shadow environment (${provider.toUpperCase()}):\n\n`
      + `${shadowPlanResult.summary || 'Review the provisioning plan.'}\n\n`
      + `Services to provision: ${(shadowPlanResult.shadowServices || []).map(s => s.shadowName).join(', ') || 'N/A'}\n`
      + `Steps: ${(shadowPlanResult.provisioningSteps || []).length}\n\n`
      + 'Approve to execute provisioning, or cancel to abort.',
    title: 'Provisioning Plan — Confirm Before Execution',
    context: {
      runId: ctx.runId,
      shadowServices: shadowPlanResult.shadowServices,
      provisioningSteps: shadowPlanResult.provisioningSteps,
      dependencyWiring: shadowPlanResult.dependencyWiring,
    },
  });

  try {

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: Shadow Environment Provisioning
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 5: Provisioning shadow environment...');

  const shadowEnvResult = await ctx.task(provisionShadowEnvironmentTask, {
    provider,
    projectIdentifier,
    region,
    chaosPrefix,
    hints,
    shadowPlan: shadowPlanResult,
    selectedComponents: componentSelectionResult,
    discovery: discoveryResult,
  });
  output.shadowEnv = shadowEnvResult;
  output.phasesExecuted.push('shadow-provisioning');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: Scenario Generation
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 6: Generating chaos scenarios based on discovered architecture...');

  const scenariosResult = await ctx.task(generateScenariosTask, {
    provider,
    projectIdentifier,
    region,
    chaosPrefix,
    hints,
    faultDomains,
    executionMode,
    discovery: discoveryResult,
    selectedComponents: componentSelectionResult,
    shadowEnv: shadowEnvResult,
  });
  output.scenarios = scenariosResult;
  output.phasesExecuted.push('scenario-generation');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: Scenario Selection (breakpoint)
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 7: Presenting scenarios for selection...');

  await ctx.breakpoint({
    question: `Generated ${scenariosResult.scenarioCount || 'N'} chaos scenarios `
      + `across ${faultDomains.length} fault domains:\n\n`
      + `${scenariosResult.summary || 'Review the scenarios list.'}\n\n`
      + 'Select which scenarios to run. Respond with scenario IDs (e.g. "S1,S3,S7") or "all".',
    title: 'Chaos Scenario Selection',
    context: {
      runId: ctx.runId,
      scenarioCount: scenariosResult.scenarioCount,
      faultDomains,
      scenarios: scenariosResult.scenarios,
    },
  });

  const selectionResult = await ctx.task(processScenarioSelectionTask, {
    scenarios: scenariosResult,
    faultDomains,
    executionMode,
  });
  output.selectedScenarios = selectionResult;
  output.phasesExecuted.push('scenario-selection');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: Baseline Measurement
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 8: Measuring baseline health of shadow environment...');

  const baselineResult = await ctx.task(measureBaselineTask, {
    provider,
    projectIdentifier,
    region,
    chaosPrefix,
    hints,
    healthCheckConfig,
    discovery: discoveryResult,
    shadowEnv: shadowEnvResult,
  });
  output.baseline = baselineResult;
  output.phasesExecuted.push('baseline-measurement');

  await ctx.breakpoint({
    question: `Baseline measurement complete:\n\n`
      + `${baselineResult.summary || 'All services healthy.'}\n\n`
      + `Services healthy: ${baselineResult.healthyCount || 0}/${baselineResult.totalCount || 0}\n\n`
      + 'Shadow environment is ready. Approve to begin fault injection?',
    title: 'Baseline OK — Ready for Chaos',
    context: {
      runId: ctx.runId,
      healthy: baselineResult.healthy,
      healthyCount: baselineResult.healthyCount,
      totalCount: baselineResult.totalCount,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9: Chaos Execution
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 9: Executing chaos tests...');

  const chaosResults = [];
  const selectedList = selectionResult.selectedScenarios || [];

  for (let i = 0; i < selectedList.length; i++) {
    const scenario = selectedList[i];
    ctx.log(`  Scenario ${i + 1}/${selectedList.length}: ${scenario.id} — ${scenario.title}`);

    if (scenario.executionType === 'automated') {
      const result = await ctx.task(executeAutomatedChaosTask, {
        provider,
        projectIdentifier,
        region,
        chaosPrefix,
        hints,
        scenario,
        baseline: baselineResult,
        safetyControls,
        shadowEnv: shadowEnvResult,
      });
      chaosResults.push({ ...scenario, result, executionType: 'automated' });

    } else {
      await ctx.breakpoint({
        question: `MANUAL CHAOS: ${scenario.title}\n\n`
          + `${scenario.instructions || 'Follow the runbook steps below.'}\n\n`
          + `Fault domain: ${scenario.faultDomain}\n`
          + `Target: ${scenario.targetService}\n`
          + `Injection method: ${scenario.injectionMethod || 'See scenario details'}\n\n`
          + 'Execute the fault injection manually, then approve this breakpoint when done.\n'
          + 'Include your observations in the response.',
        title: `Manual Chaos: ${scenario.id}`,
        context: {
          runId: ctx.runId,
          scenarioId: scenario.id,
          faultDomain: scenario.faultDomain,
          faultType: scenario.faultType,
        },
      });

      const result = await ctx.task(observeManualChaosTask, {
        provider,
        projectIdentifier,
        region,
        chaosPrefix,
        hints,
        scenario,
        baseline: baselineResult,
        safetyControls,
        shadowEnv: shadowEnvResult,
      });
      chaosResults.push({ ...scenario, result, executionType: 'manual' });
    }

    // Restore healthy state between scenarios
    if (i < selectedList.length - 1) {
      ctx.log('  Restoring healthy state before next scenario...');
      await ctx.task(restoreHealthyStateTask, {
        provider,
        projectIdentifier,
        region,
        chaosPrefix,
        hints,
        scenario,
        shadowEnv: shadowEnvResult,
      });
    }
  }

  output.chaosResults = chaosResults;
  output.phasesExecuted.push('chaos-execution');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 10: Results Analysis
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 10: Analyzing chaos test results and scoring resilience...');

  const analysisResult = await ctx.task(analyzeResultsTask, {
    provider,
    projectIdentifier,
    discovery: discoveryResult,
    baseline: baselineResult,
    chaosResults,
    faultDomains,
    safetyControls,
  });
  output.analysis = analysisResult;
  output.resilienceScore = analysisResult.resilienceScore || 0;
  output.phasesExecuted.push('results-analysis');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 11: Report Generation
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 11: Generating interactive HTML resilience report...');

  const reportResult = await ctx.task(generateReportTask, {
    provider,
    projectIdentifier,
    region,
    reportOutputPath,
    reportTheme,
    discovery: discoveryResult,
    selectedComponents: componentSelectionResult,
    scenarios: scenariosResult,
    selectedScenarios: selectionResult,
    baseline: baselineResult,
    chaosResults,
    analysis: analysisResult,
    resilienceScore: analysisResult.resilienceScore || 0,
  });
  output.report = reportResult;
  output.phasesExecuted.push('report-generation');

  await ctx.breakpoint({
    question: `Resilience report generated.\n\n`
      + `Overall Resilience Score: ${analysisResult.resilienceScore || 'N/A'}/100\n\n`
      + `${analysisResult.summary || 'Review the report.'}\n\n`
      + `Report saved to: ${reportResult.reportPath || reportOutputPath}\n\n`
      + 'Review the report, then approve to proceed with environment teardown.',
    title: 'Chaos Results — Review Before Teardown',
    context: {
      runId: ctx.runId,
      resilienceScore: analysisResult.resilienceScore,
      reportPath: reportResult.reportPath,
    },
  });

  } catch (err) {
    output.success = false;
    output.error = err.message;
    ctx.log(`Process error in phase execution: ${err.message}`);

    // Emergency teardown: ensure shadow resources are cleaned up on failure.
    if (output.phasesExecuted.includes('shadow-provisioning')) {
      ctx.log('Emergency teardown: cleaning shadow environment after failure...');
      try {
        const emergencyTeardown = await ctx.task(teardownShadowEnvironmentTask, {
          provider,
          projectIdentifier,
          region,
          chaosPrefix,
          hints,
          shadowEnv: output.shadowEnv,
          shadowPlan: shadowPlanResult,
        });
        output.teardown = emergencyTeardown;
        output.phasesExecuted.push('emergency-teardown');
      } catch (teardownErr) {
        ctx.log(`Emergency teardown failed: ${teardownErr.message}`);
      }
    }

    output.metadata.completedAt = ctx.now();
    return output;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 12: Teardown & Verification
  // ═══════════════════════════════════════════════════════════════════════════

  ctx.log('Phase 12: Tearing down shadow environment and verifying cleanup...');

  const teardownResult = await ctx.task(teardownShadowEnvironmentTask, {
    provider,
    projectIdentifier,
    region,
    chaosPrefix,
    hints,
    shadowEnv: shadowEnvResult,
    shadowPlan: shadowPlanResult,
  });

  ctx.log('  Verifying teardown — confirming all chaos resources are deleted...');

  const verifyResult = await ctx.task(verifyTeardownTask, {
    provider,
    projectIdentifier,
    region,
    chaosPrefix,
    hints,
    shadowEnv: shadowEnvResult,
    teardownResult,
  });

  output.teardown = {
    ...teardownResult,
    verification: verifyResult,
  };
  output.phasesExecuted.push('teardown-verification');

  output.success = true;

  return output;
}

// ═════════════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════

// ── Phase 1: System Discovery ────────────────────────────────────────────────

export const systemDiscoveryTask = defineTask('system-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discover services and architecture (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE and cloud infrastructure architect with multi-cloud expertise',
      task: `Discover all services, dependencies, and architecture for the ${args.provider.toUpperCase()} ${args.hints.identityLabel} "${args.projectIdentifier}" in region "${args.region}"`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        providerHints: args.hints,
      },
      instructions: [
        `You are discovering the full service topology of a cloud application on ${args.provider.toUpperCase()}.`,
        `Use the appropriate CLI tool for this provider (${args.hints.cli}) to list and inspect all resources.`,
        '',
        'DISCOVERY STEPS:',
        '',
        '1. List all deployed services by type:',
        `   - Container services (${args.hints.containerService}): list all running container deployments`,
        `   - Serverless functions (${args.hints.serverlessFunction}): list all deployed functions`,
        `   - Databases (${args.hints.database}): list all database instances and collections`,
        '   - API gateways, load balancers, CDNs, caches, message queues',
        '   - Static hosting / storage buckets serving content',
        '',
        '2. For each discovered service, collect:',
        '   - Service name and unique identifier',
        '   - Service type (generic): "container-service", "serverless-function", "database", "api-gateway", "storage", "cache", "queue", "proxy"',
        '   - Runtime (e.g. node22, python3.12, docker image)',
        '   - Region / availability zone',
        '   - Current scaling config (min/max instances, concurrency)',
        '   - Environment variables (names only, not values — to map dependencies)',
        '   - Health endpoint URL (if applicable)',
        '   - Public URL (if externally accessible)',
        '',
        '3. Map service dependencies:',
        '   - Parse environment variables to find inter-service URLs',
        '   - Identify which services call which other services',
        '   - Build a dependency graph: { from: "service-a", to: "service-b", protocol: "https", port: 443 }',
        '   - Identify external dependencies (third-party APIs, SaaS services)',
        '',
        '4. Identify existing resilience patterns:',
        '   - Retry policies, circuit breakers, timeouts configured',
        '   - Health check endpoints and their configuration',
        '   - Auto-scaling rules',
        '   - Redundancy (multi-instance, multi-zone)',
        '',
        '5. Classify each service by criticality:',
        '   - "critical": user-facing, no fallback, single point of failure',
        '   - "high": important but has partial fallback',
        '   - "medium": internal service, failure is tolerable briefly',
        '   - "low": non-essential, failure has minimal impact',
        '',
        `PROVIDER-SPECIFIC GUIDANCE for ${args.provider.toUpperCase()}:`,
        `  - GCP: use "gcloud run services list", "gcloud functions list", "gcloud firestore databases list"`,
        `  - AWS: use "aws ecs list-services", "aws lambda list-functions", "aws dynamodb list-tables"`,
        `  - Azure: use "az containerapp list", "az functionapp list", "az cosmosdb list"`,
        `  - Custom: use whatever CLI tools the project documents`,
        '',
        'Assign each component a short ID (C1, C2, C3...) for selection in the next phase.',
        'Return a structured discovery result with all services, dependencies, and resilience patterns.',
      ],
      outputFormat: 'JSON with serviceCount (number), summary (string describing the architecture), services (array of service objects with id/name/type/region/criticality/healthUrl/publicUrl), dependencies (array of {from, to, protocol}), resiliencePatterns (object), externalDependencies (array)',
    },
    outputSchema: {
      type: 'object',
      required: ['serviceCount', 'summary', 'services', 'dependencies'],
      properties: {
        serviceCount: { type: 'number' },
        summary: { type: 'string' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name', 'type', 'region', 'criticality'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              region: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              runtime: { type: 'string' },
              healthUrl: { type: 'string' },
              publicUrl: { type: 'string' },
              scalingConfig: { type: 'object' },
              envVarNames: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['from', 'to'],
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              protocol: { type: 'string' },
              port: { type: 'number' },
            },
          },
        },
        resiliencePatterns: { type: 'object' },
        externalDependencies: { type: 'array', items: { type: 'object' } },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'discovery'],
}));

// ── Phase 2: Process Component Selection ─────────────────────────────────────

export const processComponentSelectionTask = defineTask('process-component-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process user component selection',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chaos engineering coordinator',
      task: 'Process the user component selection from the breakpoint and prepare the testing scope',
      context: {
        provider: args.provider,
        discovery: args.discovery,
      },
      instructions: [
        'Read the breakpoint response to determine which components the user selected.',
        'If "all" was selected, include all discovered components.',
        'Otherwise, filter to only the selected component IDs (C1, C2, etc.).',
        '',
        'For the selected components:',
        '1. Resolve all transitive dependencies — if C1 depends on C3, include C3 even if not explicitly selected',
        '2. Order by criticality (critical first, then high, medium, low)',
        '3. For each component, confirm its type and what chaos-prefixed clone name it will get',
        '4. Generate a component map showing selected components and their dependencies',
        '',
        'Return the filtered component list with dependency information.',
      ],
      outputFormat: 'JSON with selectedComponents (array of component objects with id/name/type/chaosName/criticality), dependencyMap (object mapping component IDs to their dependency IDs), componentCount (number), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['selectedComponents', 'dependencyMap', 'componentCount', 'summary'],
      properties: {
        selectedComponents: { type: 'array', items: { type: 'object' } },
        dependencyMap: { type: 'object' },
        componentCount: { type: 'number' },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'component-selection'],
}));

// ── Phase 3: Shadow Environment Planning ─────────────────────────────────────

export const planShadowEnvironmentTask = defineTask('plan-shadow-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan shadow environment (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud infrastructure architect specializing in environment cloning and isolation',
      task: `Plan a shadow environment with ${args.chaosPrefix}-prefixed clones of the selected components on ${args.provider.toUpperCase()}`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        selectedComponents: args.selectedComponents,
        discovery: args.discovery,
      },
      instructions: [
        `Design a complete shadow environment plan for ${args.provider.toUpperCase()} that clones selected services with the "${args.chaosPrefix}" prefix.`,
        '',
        'For EACH selected component, plan:',
        '',
        '1. NAMING:',
        `   - Shadow name: "${args.chaosPrefix}-<original-name>" (e.g. "${args.chaosPrefix}-api-server")`,
        '   - Ensure names comply with the provider naming rules (length limits, character restrictions)',
        '',
        '2. DEPLOYMENT SPEC:',
        '   - Same source code / container image as the original',
        '   - Same runtime and configuration',
        '   - Minimum viable scaling (1 instance, lowest tier) to reduce cost',
        '   - Same region as original',
        '',
        '3. DEPENDENCY REWIRING:',
        '   - All inter-service references must point to OTHER shadow services, never production',
        `   - Example: if service-a calls service-b, then ${args.chaosPrefix}-service-a must call ${args.chaosPrefix}-service-b`,
        '   - Map each environment variable / config to its shadow equivalent URL',
        '   - External dependencies (third-party APIs) remain unchanged unless specifically tested',
        '',
        '4. ISOLATION:',
        '   - Shadow services must not share state with production (separate DB collections/tables/schemas)',
        '   - Shadow services must not be routable from production traffic',
        '   - Use provider-appropriate isolation (separate VPC, namespace, resource group, or naming convention)',
        '',
        '5. SEED DATA:',
        '   - Plan minimal test data seeding for databases',
        '   - Use synthetic data only, never copy production data',
        '',
        `PROVIDER GUIDANCE (${args.provider.toUpperCase()}):`,
        `  - GCP: deploy to same project with ${args.chaosPrefix}- prefix, use separate Firestore collections`,
        `  - AWS: deploy to same account with ${args.chaosPrefix}- prefix, use separate DynamoDB tables`,
        `  - Azure: deploy to same subscription in a "${args.chaosPrefix}" resource group`,
        `  - Custom: use provider-appropriate isolation mechanism`,
        '',
        'Generate the full provisioning plan with commands for each service.',
        'Do NOT execute any commands yet — this phase is planning only.',
      ],
      outputFormat: 'JSON with shadowServices (array of {originalName, shadowName, type, deploymentSpec, envVarOverrides, isolationMethod}), dependencyWiring (array of {from, to, envVar, shadowUrl}), seedDataPlan (array), provisioningSteps (array of {step, command, description}), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['shadowServices', 'dependencyWiring', 'provisioningSteps', 'summary'],
      properties: {
        shadowServices: {
          type: 'array',
          items: {
            type: 'object',
            required: ['originalName', 'shadowName', 'type'],
            properties: {
              originalName: { type: 'string' },
              shadowName: { type: 'string' },
              type: { type: 'string' },
              deploymentSpec: { type: 'object' },
              envVarOverrides: { type: 'object' },
              isolationMethod: { type: 'string' },
            },
          },
        },
        dependencyWiring: { type: 'array', items: { type: 'object' } },
        seedDataPlan: { type: 'array', items: { type: 'object' } },
        provisioningSteps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['step', 'command', 'description'],
            properties: {
              step: { type: 'number' },
              command: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'shadow-planning'],
}));

// ── Phase 4: Cost Estimation ─────────────────────────────────────────────────

export const estimateCostTask = defineTask('estimate-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: `Estimate shadow environment cost (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud FinOps analyst with deep pricing knowledge across GCP, AWS, and Azure',
      task: `Estimate the cost of running the planned shadow environment on ${args.provider.toUpperCase()}`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        providerHints: args.hints,
        shadowPlan: args.shadowPlan,
      },
      instructions: [
        `Calculate the estimated cost of running the shadow environment on ${args.provider.toUpperCase()}.`,
        '',
        'For each shadow service, estimate:',
        '',
        '1. COMPUTE COST:',
        '   - Container services: cost per vCPU-hour and per GB-hour at minimum scaling',
        '   - Serverless functions: cost per invocation + compute-time (estimate invocation count from test plan)',
        '   - Use the provider pricing for the specified region',
        '',
        '2. DATA COST:',
        '   - Database reads/writes during testing (estimate from scenario count)',
        '   - Storage for test data (minimal)',
        '   - Data transfer between services (same-region, typically free or cheap)',
        '',
        '3. NETWORKING COST:',
        '   - Egress if any external calls are made',
        '   - Load balancer / API gateway costs if applicable',
        '',
        '4. DURATION ESTIMATE:',
        '   - Provisioning time: estimate from number of services',
        '   - Testing time: estimate from scenario count and estimated duration per scenario',
        '   - Teardown time: typically 5-10 minutes',
        '   - Total estimated wall-clock hours',
        '',
        'PRICING REFERENCES:',
        '  - GCP Cloud Run: ~$0.00002400/vCPU-second, ~$0.00000250/GiB-second',
        '  - GCP Cloud Functions gen2: $0.0000025/invocation + compute time',
        '  - AWS Lambda: $0.0000002/request + $0.0000166667/GB-second',
        '  - AWS Fargate: ~$0.04048/vCPU-hour, ~$0.004445/GB-hour',
        '  - Azure Container Apps: ~$0.000024/vCPU-second, ~$0.000003/GiB-second',
        '  - Azure Functions: $0.0000002/execution + $0.000016/GB-second',
        '',
        'Return a detailed cost breakdown per service and a total estimate.',
        'Round to 2 decimal places. Express in USD.',
        'Be conservative (round up) to avoid surprise charges.',
      ],
      outputFormat: 'JSON with estimatedTotalUsd (number), estimatedDurationHours (number), costBreakdown (array of {service, computeCostUsd, dataCostUsd, networkCostUsd, subtotalUsd}), assumptions (array of strings), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedTotalUsd', 'estimatedDurationHours', 'costBreakdown', 'summary'],
      properties: {
        estimatedTotalUsd: { type: 'number' },
        estimatedDurationHours: { type: 'number' },
        costBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            required: ['service', 'subtotalUsd'],
            properties: {
              service: { type: 'string' },
              computeCostUsd: { type: 'number' },
              dataCostUsd: { type: 'number' },
              networkCostUsd: { type: 'number' },
              subtotalUsd: { type: 'number' },
            },
          },
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'cost-estimation'],
}));

// ── Phase 5: Provision Shadow Environment ────────────────────────────────────

export const provisionShadowEnvironmentTask = defineTask('provision-shadow-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Provision shadow environment (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: `Cloud DevOps engineer specializing in ${args.provider.toUpperCase()} infrastructure provisioning`,
      task: `Execute the shadow environment provisioning plan to deploy ${args.chaosPrefix}-prefixed service clones`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        shadowPlan: args.shadowPlan,
        selectedComponents: args.selectedComponents,
        discovery: args.discovery,
      },
      instructions: [
        `Execute the provisioning plan to deploy shadow services on ${args.provider.toUpperCase()}.`,
        `Use the ${args.hints.cli} CLI tool for all deployment operations.`,
        '',
        'EXECUTION STEPS:',
        '',
        '1. PRE-FLIGHT CHECKS:',
        '   - Verify CLI authentication and permissions',
        `   - Verify the ${args.hints.identityLabel} "${args.projectIdentifier}" is accessible`,
        `   - Verify the region "${args.region}" is valid`,
        '   - Check that no existing chaos-prefixed resources conflict',
        '',
        '2. DEPLOY EACH SHADOW SERVICE (in dependency order):',
        '   - Execute the provisioning commands from the shadow plan',
        '   - Deploy dependencies first (databases, caches), then compute services',
        '   - For each deployment:',
        '     a. Run the deployment command',
        '     b. Wait for the deployment to complete',
        '     c. Capture the deployed URL / endpoint',
        '     d. Log success or failure with details',
        '',
        '3. WIRE DEPENDENCIES:',
        '   - Update environment variables on deployed services to point to shadow counterparts',
        '   - Verify each wiring by checking the service configuration',
        '',
        '4. SEED TEST DATA:',
        '   - Execute the seed data plan from the shadow plan',
        '   - Use synthetic data only',
        '   - Verify data is accessible from shadow services',
        '',
        '5. HEALTH VERIFICATION:',
        '   - Hit the health endpoint of each deployed shadow service',
        '   - Confirm all services return healthy status',
        '   - If any service fails, log the error and continue with others',
        '',
        'SAFETY RULES:',
        `   - Only create resources with the "${args.chaosPrefix}" prefix`,
        '   - Never modify production resources',
        '   - If a deployment fails after 3 retries, skip it and report the failure',
        '',
        'Return the full deployment status for each service.',
      ],
      outputFormat: 'JSON with success (boolean), deployments (array of {service, shadowName, status, url, error}), wiringStatus (array of {from, to, verified}), seedDataStatus (object), healthChecks (array of {service, healthy, responseTimeMs}), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployments', 'summary'],
      properties: {
        success: { type: 'boolean' },
        deployments: {
          type: 'array',
          items: {
            type: 'object',
            required: ['service', 'shadowName', 'status'],
            properties: {
              service: { type: 'string' },
              shadowName: { type: 'string' },
              status: { type: 'string', enum: ['deployed', 'failed', 'skipped'] },
              url: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
        wiringStatus: { type: 'array', items: { type: 'object' } },
        seedDataStatus: { type: 'object' },
        healthChecks: { type: 'array', items: { type: 'object' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'provisioning'],
}));

// ── Phase 6: Generate Chaos Scenarios ────────────────────────────────────────

export const generateScenariosTask = defineTask('generate-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate chaos scenarios (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE and chaos engineer with multi-cloud expertise',
      task: `Generate comprehensive chaos test scenarios for the discovered architecture on ${args.provider.toUpperCase()}`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        faultDomains: args.faultDomains,
        executionMode: args.executionMode,
        discovery: args.discovery,
        selectedComponents: args.selectedComponents,
        shadowEnv: args.shadowEnv,
      },
      instructions: [
        `Generate chaos scenarios for EACH selected component across the ${args.faultDomains.length} fault domains.`,
        `All scenarios must target shadow (${args.chaosPrefix}-prefixed) services only, never production.`,
        '',
        'For EACH scenario provide:',
        '  - id: unique identifier (S1, S2, S3...)',
        '  - title: short descriptive name',
        '  - faultDomain: one of "service-crashes", "network-latency", "data-layer", "external-apis"',
        '  - faultType: specific fault (e.g. "container-crash", "function-timeout", "db-permission-denied", "api-rate-limit")',
        '  - targetService: which shadow service is targeted (use shadow name)',
        '  - hypothesis: "We believe that when X happens, Y should happen because Z"',
        `  - executionType: "automated" or "manual" (respect executionMode: "${args.executionMode}")`,
        '  - injectionMethod: step-by-step instructions to inject the fault using the provider CLI',
        '  - expectedBehavior: what the app should do (graceful degradation, error message, fallback)',
        '  - observationMethod: how to verify behavior (curl commands, log queries, metric checks)',
        '  - rollbackMethod: how to undo the fault injection',
        '  - severity: "critical" | "high" | "medium" | "low"',
        '  - estimatedDurationMinutes: how long the test takes',
        '  - instructions: detailed runbook for manual execution (if manual)',
        '',
        'SCENARIOS PER FAULT DOMAIN:',
        '',
        'SERVICE CRASHES (for each container/function service):',
        '  - Kill the service (scale to zero / delete)',
        '  - Force a cold start under load (redeploy with minimal resources)',
        '  - Trigger OOM (set memory limit very low)',
        '  - Set an extremely short timeout (5 seconds)',
        '  - Crash loop (deploy a broken health check)',
        '',
        'NETWORK & LATENCY (for each service-to-service connection):',
        '  - Introduce artificial latency (proxy or middleware)',
        '  - DNS resolution failure (point env var to invalid URL)',
        '  - Connection refused (wrong port in env var)',
        '  - TLS certificate mismatch',
        '  - CORS misconfiguration',
        '',
        'DATA LAYER (for each database/storage):',
        '  - Permission denied (restrictive access rules)',
        '  - Read timeout (overwhelm with writes)',
        '  - Missing indexes (if applicable)',
        '  - Write to nonexistent path/table/collection',
        '  - Data corruption simulation (write malformed records)',
        '',
        'EXTERNAL APIs (for each external dependency):',
        '  - API returns 500 (misconfigure connection)',
        '  - API returns 429 rate limit',
        '  - API key revoked (use invalid credentials)',
        '  - API response payload changed (unexpected schema)',
        '',
        `EXECUTION MODE "${args.executionMode}":`,
        '  - "automated": mark all scenarios as automated where possible',
        '  - "manual": mark all scenarios as manual',
        '  - "hybrid": mark simple CLI-based faults as automated, complex ones as manual',
        '',
        'PROVIDER-SPECIFIC INJECTION EXAMPLES:',
        `  - GCP container crash: gcloud run services update <shadow-name> --max-instances=0 --region=${args.region}`,
        `  - AWS container crash: aws ecs update-service --desired-count 0 --service <shadow-name>`,
        `  - Azure container crash: az containerapp update --name <shadow-name> --max-replicas 0`,
        `  - GCP function timeout: gcloud functions deploy <shadow-name> --timeout=5s`,
        `  - AWS function timeout: aws lambda update-function-configuration --timeout 5`,
        `  - Azure function timeout: az functionapp config appsettings set --settings "AzureFunctionsJobHost__functionTimeout=00:00:05"`,
        '',
        'Return a summary at the top with counts per domain, then the full scenario array.',
      ],
      outputFormat: 'JSON with scenarioCount (number), summary (string with per-domain counts), scenarios (array of scenario objects), domainBreakdown (object with counts per domain)',
    },
    outputSchema: {
      type: 'object',
      required: ['scenarioCount', 'summary', 'scenarios', 'domainBreakdown'],
      properties: {
        scenarioCount: { type: 'number' },
        summary: { type: 'string' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'id', 'title', 'faultDomain', 'faultType', 'targetService',
              'hypothesis', 'executionType', 'injectionMethod',
              'expectedBehavior', 'observationMethod', 'rollbackMethod',
              'severity', 'estimatedDurationMinutes',
            ],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              faultDomain: { type: 'string', enum: ['service-crashes', 'network-latency', 'data-layer', 'external-apis'] },
              faultType: { type: 'string' },
              targetService: { type: 'string' },
              hypothesis: { type: 'string' },
              executionType: { type: 'string', enum: ['automated', 'manual'] },
              injectionMethod: { type: 'string' },
              expectedBehavior: { type: 'string' },
              observationMethod: { type: 'string' },
              rollbackMethod: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              estimatedDurationMinutes: { type: 'number' },
              instructions: { type: 'string' },
            },
          },
        },
        domainBreakdown: { type: 'object' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'scenario-generation'],
}));

// ── Phase 7: Process Scenario Selection ──────────────────────────────────────

export const processScenarioSelectionTask = defineTask('process-scenario-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process user scenario selection',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chaos engineering coordinator',
      task: 'Process the user scenario selection from the breakpoint and prepare the execution plan',
      context: {
        scenarios: args.scenarios,
        faultDomains: args.faultDomains,
        executionMode: args.executionMode,
      },
      instructions: [
        'Read the breakpoint response to determine which scenarios the user selected.',
        'If "all" was selected, include all scenarios.',
        'Otherwise, filter to only the selected scenario IDs (S1, S2, etc.).',
        '',
        '1. Parse the user response to extract scenario IDs',
        '2. Filter the scenarios array to only include selected ones',
        '3. Order scenarios by: severity (critical first), then by fault domain grouping',
        '4. For each selected scenario, confirm executionType (automated vs manual)',
        `5. If executionMode is "${args.executionMode}", override executionType accordingly:`,
        '   - "automated": force all to automated',
        '   - "manual": force all to manual',
        '   - "hybrid": keep original assignment',
        '6. Generate an execution timeline with estimated total duration',
        '7. Validate that rollback methods exist for all selected scenarios',
        '',
        'Return the filtered, ordered scenario list and execution plan.',
      ],
      outputFormat: 'JSON with selectedScenarios (array of scenario objects), executionPlan (string summary), totalEstimatedMinutes (number), automatedCount (number), manualCount (number)',
    },
    outputSchema: {
      type: 'object',
      required: ['selectedScenarios', 'executionPlan', 'totalEstimatedMinutes'],
      properties: {
        selectedScenarios: { type: 'array', items: { type: 'object' } },
        executionPlan: { type: 'string' },
        totalEstimatedMinutes: { type: 'number' },
        automatedCount: { type: 'number' },
        manualCount: { type: 'number' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'scenario-selection'],
}));

// ── Phase 8: Baseline Measurement ────────────────────────────────────────────

export const measureBaselineTask = defineTask('measure-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Measure baseline health (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE engineer measuring system health and establishing performance baselines',
      task: 'Verify the shadow environment is healthy and measure baseline metrics for all services',
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        healthCheckConfig: args.healthCheckConfig,
        discovery: args.discovery,
        shadowEnv: args.shadowEnv,
      },
      instructions: [
        'Measure the baseline (healthy state) of all shadow services before chaos injection.',
        '',
        '1. HEALTH ENDPOINT CHECKS:',
        '   - For each shadow service with a health URL, send a GET request',
        '   - Expect 200 OK response',
        '   - Record response time',
        '',
        '2. LATENCY BASELINE:',
        `   - For each health endpoint, run ${args.healthCheckConfig.sampleCount} sequential requests`,
        '   - Record each response time',
        '   - Calculate: min, max, avg, p50, p95, p99',
        `   - Timeout threshold: ${args.healthCheckConfig.timeoutSeconds} seconds`,
        '',
        '3. FUNCTIONAL SMOKE TESTS:',
        '   - Send a minimal valid request to each service endpoint',
        '   - Verify the response matches expected format',
        '   - Test error handling: send an invalid request, expect proper error response (not 500 HTML)',
        '   - Verify inter-service communication works (e.g. service A can reach service B)',
        '',
        '4. LOGGING VERIFICATION:',
        `   - Use the ${args.hints.cli} CLI to check that logs are flowing for shadow services`,
        '   - Verify structured logging is in place',
        '',
        '5. RECORD BASELINE METRICS:',
        '   - Per-service response time (avg, p99)',
        '   - Per-service error rate (should be 0%)',
        '   - Per-service availability (UP/DOWN)',
        '   - End-to-end latency (if applicable)',
        '',
        'Use curl with timing: curl -w "time_total: %{time_total}s\\nhttp_code: %{http_code}" -o /dev/null -s <url>',
        '',
        'Return healthy (boolean) only if ALL services pass health checks.',
      ],
      outputFormat: 'JSON with healthy (boolean), healthyCount (number), totalCount (number), services (array of {name, shadowName, healthy, avgResponseTimeMs, p99ResponseTimeMs, errorRate, status}), endToEndLatencyMs (number), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['healthy', 'healthyCount', 'totalCount', 'services', 'summary'],
      properties: {
        healthy: { type: 'boolean' },
        healthyCount: { type: 'number' },
        totalCount: { type: 'number' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'healthy'],
            properties: {
              name: { type: 'string' },
              shadowName: { type: 'string' },
              healthy: { type: 'boolean' },
              avgResponseTimeMs: { type: 'number' },
              p99ResponseTimeMs: { type: 'number' },
              errorRate: { type: 'number' },
              status: { type: 'string' },
            },
          },
        },
        endToEndLatencyMs: { type: 'number' },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'baseline'],
}));

// ── Phase 9a: Automated Chaos Execution ──────────────────────────────────────

export const executeAutomatedChaosTask = defineTask('execute-automated-chaos', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automated chaos: ${args.scenario.title}`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chaos engineer executing fault injection with safety controls',
      task: `Execute automated chaos scenario: ${args.scenario.title}`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        scenario: args.scenario,
        baseline: args.baseline,
        safetyControls: args.safetyControls,
        shadowEnv: args.shadowEnv,
      },
      instructions: [
        `Execute chaos scenario: ${args.scenario.id} — ${args.scenario.title}`,
        `Provider: ${args.provider.toUpperCase()} | Target: ${args.scenario.targetService}`,
        `Fault domain: ${args.scenario.faultDomain} | Type: ${args.scenario.faultType}`,
        '',
        'EXECUTION PROTOCOL (follow exactly):',
        '',
        '1. PRE-CHECK:',
        '   - Verify the target shadow service is healthy (hit health endpoint)',
        '   - Record pre-injection metrics (response time, status code)',
        `   - Confirm the target name contains "${args.chaosPrefix}" prefix — NEVER touch production`,
        '',
        '2. INJECT FAULT:',
        `   - Method: ${args.scenario.injectionMethod}`,
        `   - Use the ${args.hints.cli} CLI to execute the injection`,
        '   - Record the exact commands executed and their output',
        '   - Record the injection timestamp',
        '',
        '3. WAIT FOR PROPAGATION:',
        '   - Wait 15-30 seconds for the fault to take effect',
        '   - Check service status to confirm the fault is active',
        '',
        '4. OBSERVE AND MEASURE:',
        '   - Send 5-10 test requests to the affected service and dependent services',
        '   - Record: response codes, response times, error messages, response bodies',
        '   - Check for graceful degradation vs. hard failure',
        '   - Check if circuit breakers or retries activate',
        '   - Check if error messages are user-friendly',
        `   - Check logs using ${args.hints.cli} for error patterns`,
        '',
        '5. COMPARE AGAINST HYPOTHESIS:',
        `   - Hypothesis: "${args.scenario.hypothesis}"`,
        `   - Expected behavior: "${args.scenario.expectedBehavior}"`,
        '   - Document deviations from expected behavior',
        '',
        '6. SAFETY CHECK:',
        `   - If error rate exceeds ${args.safetyControls.maxErrorRatePercent}% for longer than ${args.safetyControls.rollbackTimeoutSeconds}s, trigger immediate rollback`,
        `   - Auto-abort enabled: ${args.safetyControls.autoAbort}`,
        '',
        '7. ROLLBACK:',
        `   - Method: ${args.scenario.rollbackMethod}`,
        '   - Execute rollback commands',
        '   - Wait 30 seconds for recovery',
        '',
        '8. POST-ROLLBACK VERIFICATION:',
        '   - Hit health endpoint — confirm service is healthy again',
        '   - Send a test request — confirm normal behavior is restored',
        '   - Record recovery time (time from rollback to healthy)',
        '',
        'PASS/FAIL CRITERIA:',
        '  - PASS: system behaved as expected (graceful degradation, proper errors, recovery)',
        '  - FAIL: unexpected behavior (crash, data loss, silent failure, no error handling)',
      ],
      outputFormat: 'JSON with passed (boolean), observations (string), metrics (object with preInjection, duringChaos, postRollback sub-objects each containing responseTimeMs, errorRate, statusCodes), deviationsFromExpected (array of strings), rollbackSuccess (boolean), recoveryTimeSeconds (number), commandsExecuted (array of strings), timestamp (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'observations', 'metrics', 'rollbackSuccess', 'recoveryTimeSeconds'],
      properties: {
        passed: { type: 'boolean' },
        observations: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            preInjection: { type: 'object' },
            duringChaos: { type: 'object' },
            postRollback: { type: 'object' },
          },
        },
        deviationsFromExpected: { type: 'array', items: { type: 'string' } },
        rollbackSuccess: { type: 'boolean' },
        recoveryTimeSeconds: { type: 'number' },
        commandsExecuted: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'execution', 'automated'],
}));

// ── Phase 9b: Observe Manual Chaos ───────────────────────────────────────────

export const observeManualChaosTask = defineTask('observe-manual-chaos', (args, taskCtx) => ({
  kind: 'agent',
  title: `Observe manual chaos: ${args.scenario.title}`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE observing system behavior during manual fault injection',
      task: `Observe and measure system behavior after manual chaos: ${args.scenario.title}`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        scenario: args.scenario,
        baseline: args.baseline,
        safetyControls: args.safetyControls,
        shadowEnv: args.shadowEnv,
      },
      instructions: [
        `The user has manually injected fault: ${args.scenario.id} — ${args.scenario.title}`,
        `Provider: ${args.provider.toUpperCase()} | Target: ${args.scenario.targetService}`,
        '',
        'NOW OBSERVE AND MEASURE:',
        '',
        '1. IMMEDIATE OBSERVATION:',
        '   - Send test requests to the affected shadow service endpoint',
        '   - Send test requests to services that depend on the affected service',
        '   - Record response codes, response times, error messages',
        '',
        '2. LOG ANALYSIS:',
        `   - Use ${args.hints.cli} to query logs for the shadow services`,
        '   - Look for error patterns, stack traces, timeout messages',
        '   - Check if structured error responses are present',
        '',
        '3. BEHAVIOR ASSESSMENT:',
        '   - Does the system degrade gracefully or crash entirely?',
        '   - Are error messages user-friendly or cryptic?',
        '   - Do circuit breakers activate?',
        '   - Do retries trigger? If so, how many?',
        '   - Is there a fallback mechanism?',
        '',
        '4. METRIC COLLECTION:',
        '   - Response time during chaos vs. baseline',
        '   - Error rate during chaos',
        '   - Number of affected downstream services',
        '   - Time to detect the failure (if alerts exist)',
        '',
        '5. COMPARE AGAINST HYPOTHESIS:',
        `   - Hypothesis: "${args.scenario.hypothesis}"`,
        `   - Expected: "${args.scenario.expectedBehavior}"`,
        '   - Document all deviations',
        '',
        '6. SAFETY:',
        `   - If error rate exceeds ${args.safetyControls.maxErrorRatePercent}%, alert the user to rollback`,
        '',
        'After observation, the user will rollback the manual change.',
        'Return comprehensive observations and measurements.',
      ],
      outputFormat: 'JSON with passed (boolean), observations (string), metrics (object with duringChaos sub-object), deviationsFromExpected (array of strings), rollbackSuccess (boolean), affectedServices (array of strings), logSnippets (array of strings)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'observations', 'metrics', 'rollbackSuccess'],
      properties: {
        passed: { type: 'boolean' },
        observations: { type: 'string' },
        metrics: { type: 'object' },
        deviationsFromExpected: { type: 'array', items: { type: 'string' } },
        rollbackSuccess: { type: 'boolean' },
        affectedServices: { type: 'array', items: { type: 'string' } },
        logSnippets: { type: 'array', items: { type: 'string' } },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'execution', 'manual-observation'],
}));

// ── Phase 9c: Restore Healthy State ──────────────────────────────────────────

export const restoreHealthyStateTask = defineTask('restore-healthy-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Restore healthy state after: ${args.scenario.title}`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE restoring system to known-good state between chaos scenarios',
      task: `Restore the shadow environment to healthy state after scenario: ${args.scenario.title}`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        scenario: args.scenario,
        shadowEnv: args.shadowEnv,
      },
      instructions: [
        `Restore the shadow environment to a healthy state after chaos scenario: ${args.scenario.id}`,
        `Use the ${args.hints.cli} CLI for all operations.`,
        '',
        '1. EXECUTE ROLLBACK:',
        `   - Rollback method: ${args.scenario.rollbackMethod || 'Redeploy original shadow service'}`,
        '   - Execute the rollback commands',
        '   - If rollback fails, attempt a full redeployment of the affected service from the shadow plan',
        '',
        '2. WAIT FOR STABILIZATION:',
        '   - Wait 30 seconds for services to stabilize',
        '   - Some services need time for new instances to spin up',
        '',
        '3. VERIFY HEALTH:',
        '   - Hit health endpoints for ALL shadow services (not just the affected one)',
        '   - Confirm all return 200 OK',
        '   - Send a functional test request to verify end-to-end connectivity',
        '',
        '4. VERIFY CLEAN STATE:',
        '   - Confirm no residual fault injection is active',
        '   - Check that service configuration matches the original shadow deployment',
        '   - Verify inter-service communication works',
        '',
        'If restoration fails after 3 attempts, flag the failure and recommend manual intervention.',
      ],
      outputFormat: 'JSON with restored (boolean), healthChecks (array of {service, healthy}), restorationSteps (array of strings), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['restored', 'healthChecks', 'summary'],
      properties: {
        restored: { type: 'boolean' },
        healthChecks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['service', 'healthy'],
            properties: {
              service: { type: 'string' },
              healthy: { type: 'boolean' },
            },
          },
        },
        restorationSteps: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'restore'],
}));

// ── Phase 10: Analyze Results ────────────────────────────────────────────────

export const analyzeResultsTask = defineTask('analyze-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze chaos test results and score resilience',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE and resilience analyst specializing in chaos engineering metrics',
      task: 'Analyze all chaos test results and produce a resilience scorecard (0-100)',
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        discovery: args.discovery,
        baseline: args.baseline,
        chaosResults: args.chaosResults,
        faultDomains: args.faultDomains,
        safetyControls: args.safetyControls,
      },
      instructions: [
        'Analyze ALL chaos test results and score the system across 5 resilience dimensions.',
        'Each dimension scores 0-20 for a total of 0-100.',
        '',
        '1. FAULT TOLERANCE (0-20):',
        '   How well does the system handle component failures?',
        '   - 16-20: Circuit breakers activate, graceful degradation, no cascading failures',
        '   - 11-15: Partial degradation, some error handling, minor cascading effects',
        '   - 6-10: Significant failures propagate, some services crash, partial recovery',
        '   - 0-5: Cascading failures, no error handling, complete system collapse',
        '   Evidence to check: service crash scenarios, OOM scenarios, timeout scenarios',
        '',
        '2. RECOVERY TIME (0-20):',
        '   How quickly does the system recover from failures?',
        '   - 16-20: Recovery within 30 seconds, automated self-healing',
        '   - 11-15: Recovery within 2 minutes, some manual intervention',
        '   - 6-10: Recovery within 10 minutes, significant manual intervention',
        '   - 0-5: Recovery takes longer than 10 minutes or requires redeployment',
        '   Evidence to check: recoveryTimeSeconds from each scenario result',
        '',
        '3. DATA INTEGRITY (0-20):',
        '   Is data safe during and after chaos?',
        '   - 16-20: No data loss, no corruption, transactions are atomic',
        '   - 11-15: Minor data inconsistencies, self-correcting',
        '   - 6-10: Some data loss or corruption, manual fix needed',
        '   - 0-5: Significant data loss or corruption',
        '   Evidence to check: data-layer scenarios, write failure scenarios',
        '',
        '4. USER EXPERIENCE (0-20):',
        '   What does the end user experience during chaos?',
        '   - 16-20: Clear error messages, app remains usable with degraded features',
        '   - 11-15: Some cryptic errors, but app stays accessible',
        '   - 6-10: Blank pages, confusing errors, partially inaccessible',
        '   - 0-5: Complete outage, no error messaging, blank screens',
        '   Evidence to check: response bodies, error message quality, HTTP status codes',
        '',
        '5. OBSERVABILITY (0-20):',
        '   Can the team detect, diagnose, and respond to failures?',
        '   - 16-20: Structured logs, clear error codes, actionable alerts trigger',
        '   - 11-15: Logs present but unstructured, some error context',
        '   - 6-10: Minimal logging, errors are generic (500 with HTML body)',
        '   - 0-5: No logging during failures, silent errors',
        '   Evidence to check: log snippets, error response formats, alert triggers',
        '',
        'FOR EACH DIMENSION provide:',
        '  - score (0-20)',
        '  - findings (array of specific observations)',
        '  - strengths (array of what worked well)',
        '  - weaknesses (array of what needs improvement)',
        '  - recommendations (array of specific, actionable fixes)',
        '',
        'ALSO PROVIDE:',
        '  - criticalFindings: top 3 most important issues discovered',
        '  - strengths: top 3 things the system does well under chaos',
        '  - remediationPlan: prioritized list ordered by (severity x effort), each with:',
        '    - title, description, severity (critical/high/medium/low), estimatedEffort (hours), impactedDimensions',
        '',
        'Overall resilienceScore = sum of all 5 dimension scores (0-100).',
      ],
      outputFormat: 'JSON with resilienceScore (number 0-100), dimensions (array of 5 objects with name/score/findings/strengths/weaknesses/recommendations), criticalFindings (array of top 3), strengths (array of top 3), remediationPlan (array of prioritized fixes), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['resilienceScore', 'dimensions', 'criticalFindings', 'strengths', 'remediationPlan', 'summary'],
      properties: {
        resilienceScore: { type: 'number' },
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'score', 'findings', 'strengths', 'weaknesses', 'recommendations'],
            properties: {
              name: { type: 'string' },
              score: { type: 'number' },
              findings: { type: 'array', items: { type: 'string' } },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        criticalFindings: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        remediationPlan: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'description', 'severity', 'estimatedEffort'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              estimatedEffort: { type: 'string' },
              impactedDimensions: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'analysis'],
}));

// ── Phase 11: Generate HTML Report ───────────────────────────────────────────

export const generateReportTask = defineTask('generate-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate interactive HTML resilience report',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer and data visualization expert specializing in SRE reports',
      task: `Generate a comprehensive, ${args.reportTheme}-themed, interactive HTML resilience report`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        reportOutputPath: args.reportOutputPath,
        reportTheme: args.reportTheme,
        discovery: args.discovery,
        selectedComponents: args.selectedComponents,
        scenarios: args.scenarios,
        selectedScenarios: args.selectedScenarios,
        baseline: args.baseline,
        chaosResults: args.chaosResults,
        analysis: args.analysis,
        resilienceScore: args.resilienceScore,
      },
      instructions: [
        `Generate a single-file HTML report (inline CSS/JS) with Apple-style design.`,
        `Save to: ${args.reportOutputPath}`,
        '',
        'IMPORTANT: Read the design reference at docs/chaos-report.html for the',
        'exact look and feel. The generated report MUST match this design exactly.',
        '',
        'REPORT SECTIONS (with sticky nav linking to each):',
        '',
        '1. HEADER (hero section):',
        `   - Title: "Chaos Monkey Resilience Report" with provider badge (${args.provider.toUpperCase()})`,
        `   - Project: "${args.projectIdentifier}", Region: "${args.region}"`,
        '   - Date of test execution',
        '   - Score ring (SVG circular progress, 150x150px)',
        '   - Stat strip below: scenarios tested, passed, failed, duration',
        '',
        '2. EXECUTIVE SUMMARY:',
        '   - Purpose statement (why this test was run) highlighted in a card',
        '   - Two summary cards: Critical Findings (red label) and Key Strengths (green label)',
        '   - Assessment banner with border-left accent',
        '',
        '3. TEST WORKFLOW:',
        '   - Vertical workflow showing test phases (Planning → Discovery → Provisioning → Baseline → Execution → Analysis → Teardown)',
        '   - Each step as a card with icon, title, and brief description',
        '   - Connected by vertical arrows between steps',
        '',
        '4. ARCHITECTURE DIAGRAM:',
        '   - Service dependency map showing tested components',
        '   - Highlight tested vs. untested components',
        '   - Component coverage badges table (tested in green, not tested in grey)',
        '',
        '5. TEST PROCESS:',
        '   - Collapsible phase cards (5 phases: Environment Strategy, Provisioning, Baseline, Execution, Teardown)',
        '   - Each card has description text and code blocks with actual commands',
        '',
        '6. RESILIENCE SCORECARD:',
        '   - Score bars (horizontal) for each of 5 dimensions (0-20 each)',
        '   - Bar colors: green (16-20), yellow (11-15), red (0-10)',
        '   - 8px tall track with rounded pill fill, animated on scroll',
        '   - Score value at the end of each row',
        '',
        '7. SCENARIO RESULTS:',
        '   - Collapsible scenario cards with header grid: ID, title, status badge, chevron',
        '   - Click to expand detailed body with observations, metrics, hypothesis, commands',
        '   - Status badges: green pill for PASS, red pill for FAIL',
        '   - Finding pills at bottom of each card with colored dots',
        '',
        '8. FINDINGS:',
        '   - Finding items with severity badge, title, description',
        '   - Strength items with green accent',
        '',
        '9. REMEDIATION PLAN:',
        '   - Clean table with columns: Priority, Item, Severity, Effort',
        '   - Priority badges: red (critical), yellow (high), blue (medium)',
        '   - Hover highlight on rows',
        '',
        '10. METRICS:',
        '    - Grid of metric cards (one per service)',
        '    - Each card shows service name, avg latency, p99 latency',
        '    - Large tabular-nums font for metric values',
        '',
        '═══════════════════════════════════════════════════════════════════',
        'APPLE-STYLE DESIGN SYSTEM (MUST MATCH EXACTLY):',
        '═══════════════════════════════════════════════════════════════════',
        '',
        'FONTS:',
        '  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap")',
        '  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        '  --font: "DM Mono", "SF Mono", Menlo, monospace',
        '  -webkit-font-smoothing: antialiased',
        '',
        'CSS VARIABLES:',
        '  --bg: #ffffff',
        '  --surface: #fbfbfd',
        '  --border: #d2d2d7',
        '  --text: #1d1d1f',
        '  --muted: #6e6e73',
        '  --red: #ff3b30',
        '  --green: #34c759',
        '  --yellow: #ff9500',
        '  --blue: #007aff',
        '  --purple: #af52de',
        '  --radius: 12px',
        '',
        'LAYOUT:',
        '  .page { max-width: 980px; margin: 0 auto; padding: 3rem clamp(1.5rem, 5vw, 4rem) 8rem }',
        '  Base font-size: 16px, body line-height: 1.75',
        '  Sections: margin-bottom: 5rem; padding-top: 2.5rem; border-top: 1px solid #e8e8ed',
        '  h2: font-size 1.6rem, weight 700, border-bottom: 2px solid #e8e8ed',
        '',
        'NAVIGATION (sticky, frosted glass):',
        '  position: sticky; top: 0; z-index: 100',
        '  background: rgba(255,255,255,0.88)',
        '  backdrop-filter: blur(20px) saturate(180%)',
        '  Links: 0.82rem, weight 500, color var(--muted), active: var(--blue)',
        '',
        'CARDS:',
        '  background: var(--surface)',
        '  border-radius: 12px',
        '  box-shadow: 0 2px 12px rgba(0,0,0,0.04)',
        '  hover: box-shadow: 0 4px 24px rgba(0,0,0,0.08)',
        '',
        'SCORE RING (SVG):',
        '  150x150px, stroke-width: 5, stroke-linecap: round',
        '  Track: stroke #f5f5f7, Fill: stroke var(--red/yellow/green based on score)',
        '  Circumference: 424.1 (2π × 67.5)',
        '  Animate dashoffset from 424.1 to target value',
        '  Score number: 2.2rem weight 700, denominator: 0.7rem weight 400',
        '',
        'STAT STRIP:',
        '  grid auto-fit minmax(160px, 1fr)',
        '  stat-val: 2.2rem weight 700, tabular-nums',
        '  stat-desc: 0.82rem var(--muted)',
        '  Cells separated by 1px border-right var(--border)',
        '',
        'STATUS BADGES:',
        '  border-radius: 99px (pill), font-size: 0.82rem, weight 600',
        '  .pass: background var(--green), color #fff',
        '  .fail: background var(--red), color #fff',
        '',
        'SCORE BARS:',
        '  track: height 8px, background #f5f5f7, border-radius 99px',
        '  fill: border-radius 99px, animated width transition 1s cubic-bezier(0.4,0,0.2,1)',
        '  Colors: .low=var(--red), .mid=var(--yellow), .high=var(--green)',
        '',
        'TABLES:',
        '  border-collapse: collapse, border-radius 12px overflow hidden',
        '  th: 0.85rem, weight 600, uppercase, letter-spacing 0.05em, color var(--muted)',
        '  td: 0.85rem padding 0.9rem 1rem, border-bottom 1px solid #f0f0f0',
        '  tr:hover: background rgba(0,122,255,0.02)',
        '',
        'ANIMATIONS:',
        '  @keyframes fadeInUp: from opacity 0 translateY(12px) to opacity 1 translateY(0)',
        '  IntersectionObserver on sections: threshold 0.08, rootMargin "0px 0px -40px 0px"',
        '  All transitions: cubic-bezier(0.4,0,0.2,1)',
        '  Score ring and bar fills animate on scroll into view',
        '',
        'COLLAPSIBLE CARDS:',
        '  .scenario-header: cursor pointer, grid: auto 1fr auto auto',
        '  .chevron: rotate(180deg) when .open',
        '  .scenario-body: display none, shown when .open',
        '  toggleCard(id) function',
        '',
        'RESPONSIVE (max-width: 700px):',
        '  Stack header, hide table headers, show data-label pseudo-elements',
        '',
        'PRINT:',
        '  Hide nav, expand all collapsed sections, disable animations/shadows',
        '',
        '::selection { background: rgba(0,122,255,0.15) }',
        '',
        `Write the complete HTML file to ${args.reportOutputPath}`,
      ],
      outputFormat: 'JSON with reportPath (string), success (boolean), sectionCount (number), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'success', 'summary'],
      properties: {
        reportPath: { type: 'string' },
        success: { type: 'boolean' },
        sectionCount: { type: 'number' },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'report'],
}));

// ── Phase 12a: Teardown Shadow Environment ───────────────────────────────────

export const teardownShadowEnvironmentTask = defineTask('teardown-shadow-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tear down shadow environment (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: `Cloud DevOps engineer performing safe environment teardown on ${args.provider.toUpperCase()}`,
      task: `Delete all ${args.chaosPrefix}-prefixed shadow services and resources`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        shadowEnv: args.shadowEnv,
        shadowPlan: args.shadowPlan,
      },
      instructions: [
        `Delete ALL ${args.chaosPrefix}-prefixed resources created during this chaos test session.`,
        `Use the ${args.hints.cli} CLI for all deletion operations.`,
        '',
        'TEARDOWN PROTOCOL:',
        '',
        '1. IDENTIFY ALL CHAOS RESOURCES:',
        '   - List all resources from the shadow environment deployment record',
        '   - Cross-reference with the shadow plan to ensure nothing is missed',
        `   - Also search for any resources with "${args.chaosPrefix}" in the name that may have been created outside the plan`,
        '',
        '2. DELETE IN REVERSE DEPENDENCY ORDER:',
        '   - Delete compute services first (functions, containers)',
        '   - Delete networking resources (load balancers, DNS entries)',
        '   - Delete data resources last (databases, storage)',
        '   - Delete container images / artifacts',
        '',
        '3. FOR EACH RESOURCE:',
        `   a. SAFETY CHECK: confirm the resource name contains "${args.chaosPrefix}" — NEVER delete production resources`,
        '   b. Execute the deletion command',
        '   c. Wait for deletion to complete',
        '   d. Record success or failure',
        '',
        '4. CLEAN UP AUXILIARY RESOURCES:',
        '   - Remove any IAM bindings created for chaos services',
        '   - Remove any secrets or config entries created for chaos',
        '   - Clean up any test data seeded into databases',
        '   - Remove any chaos-specific firewall rules or security groups',
        '',
        `PROVIDER-SPECIFIC DELETION COMMANDS (${args.provider.toUpperCase()}):`,
        '  - GCP Cloud Run: gcloud run services delete <name> --region=<region> --quiet',
        '  - GCP Functions: gcloud functions delete <name> --region=<region> --quiet',
        '  - AWS ECS: aws ecs delete-service --service <name> --force',
        '  - AWS Lambda: aws lambda delete-function --function-name <name>',
        '  - Azure Container App: az containerapp delete --name <name> --resource-group <rg> --yes',
        '  - Azure Functions: az functionapp delete --name <name> --resource-group <rg>',
        '',
        'If a resource does not exist (already deleted), skip it and log as "already-clean".',
        'NEVER delete resources that do not contain the chaos prefix in their name.',
      ],
      outputFormat: 'JSON with success (boolean), deletions (array of {resource, type, status, error}), cleanupActions (array of {action, status}), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deletions', 'summary'],
      properties: {
        success: { type: 'boolean' },
        deletions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['resource', 'type', 'status'],
            properties: {
              resource: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string', enum: ['deleted', 'already-clean', 'failed'] },
              error: { type: 'string' },
            },
          },
        },
        cleanupActions: { type: 'array', items: { type: 'object' } },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'teardown'],
}));

// ── Phase 12b: Verify Teardown ───────────────────────────────────────────────

export const verifyTeardownTask = defineTask('verify-teardown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify teardown complete (${args.provider.toUpperCase()})`,

  agent: {
    name: 'general-purpose',
    prompt: {
      role: `Cloud resource auditor verifying complete cleanup on ${args.provider.toUpperCase()}`,
      task: `Verify that ALL ${args.chaosPrefix}-prefixed resources have been completely removed`,
      context: {
        provider: args.provider,
        projectIdentifier: args.projectIdentifier,
        region: args.region,
        chaosPrefix: args.chaosPrefix,
        providerHints: args.hints,
        shadowEnv: args.shadowEnv,
        teardownResult: args.teardownResult,
      },
      instructions: [
        `Run comprehensive verification to confirm all ${args.chaosPrefix}-prefixed resources are gone.`,
        `Use the ${args.hints.cli} CLI for all queries.`,
        '',
        'VERIFICATION CHECKS:',
        '',
        '1. COMPUTE RESOURCES:',
        `   - List all container services and filter for "${args.chaosPrefix}" — expect empty`,
        `   - List all serverless functions and filter for "${args.chaosPrefix}" — expect empty`,
        `   - List all VM instances and filter for "${args.chaosPrefix}" — expect empty`,
        '',
        '2. NETWORKING RESOURCES:',
        `   - List all load balancers and filter for "${args.chaosPrefix}" — expect empty`,
        `   - List all DNS entries and filter for "${args.chaosPrefix}" — expect empty`,
        '',
        '3. DATA RESOURCES:',
        `   - Check for any ${args.chaosPrefix}-prefixed database tables/collections`,
        `   - Check for any ${args.chaosPrefix}-prefixed storage buckets`,
        '',
        '4. ARTIFACTS:',
        `   - Check container registries for ${args.chaosPrefix}-prefixed images`,
        `   - Check for leftover build artifacts`,
        '',
        '5. IAM / SECURITY:',
        `   - Check for any ${args.chaosPrefix}-related IAM bindings or roles`,
        `   - Check for any ${args.chaosPrefix}-related security groups or firewall rules`,
        '',
        `PROVIDER-SPECIFIC QUERIES (${args.provider.toUpperCase()}):`,
        `  - GCP: gcloud run services list --filter="metadata.name~${args.chaosPrefix}" --format=json`,
        `  - GCP: gcloud functions list --filter="name~${args.chaosPrefix}" --format=json`,
        `  - AWS: aws ecs list-services --query "serviceArns[?contains(@, '${args.chaosPrefix}')]"`,
        `  - AWS: aws lambda list-functions --query "Functions[?contains(FunctionName, '${args.chaosPrefix}')]"`,
        `  - Azure: az resource list --query "[?contains(name, '${args.chaosPrefix}')]"`,
        '',
        'If any chaos resources remain, list them as orphaned and provide the deletion commands.',
        'Return clean=true only if ALL queries return empty results.',
      ],
      outputFormat: 'JSON with clean (boolean), checksPerformed (array of {check, result, resourcesFound}), orphanedResources (array of {resource, type, deletionCommand}), summary (string)',
    },
    outputSchema: {
      type: 'object',
      required: ['clean', 'checksPerformed', 'summary'],
      properties: {
        clean: { type: 'boolean' },
        checksPerformed: {
          type: 'array',
          items: {
            type: 'object',
            required: ['check', 'result'],
            properties: {
              check: { type: 'string' },
              result: { type: 'string', enum: ['clean', 'orphaned', 'error'] },
              resourcesFound: { type: 'number' },
            },
          },
        },
        orphanedResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              type: { type: 'string' },
              deletionCommand: { type: 'string' },
            },
          },
        },
        summary: { type: 'string' },
      },
    },
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ['chaos', 'verification'],
}));
