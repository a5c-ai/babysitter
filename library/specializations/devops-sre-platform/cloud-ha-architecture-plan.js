// SPDX-License-Identifier: ISC
// Copyright (c) 2026 Contributors — https://opensource.org/licenses/ISC

/**
 * @process cloud-ha-architecture-plan
 * @description Cloud-agnostic high-availability architecture planning process.
 *   Audits current infrastructure, identifies HA gaps, designs target architecture
 *   across compute/data/network tiers, estimates costs, creates migration plan,
 *   generates IaC scripts, produces architecture diagrams (DrawIO), compiles a
 *   comprehensive architecture document, and quality-reviews the deliverables.
 *
 *   Supports GCP, AWS, and Azure. Diagram generation uses the
 *   `generating-gcp-diagrams` or `generating-aws-diagrams` skills when available.
 *
 * @inputs {
 *   projectIdentifier, cloudProvider, targetRegion, slaTarget, budgetCeiling,
 *   currentArchitecture, diagramConfig, compositionPattern
 * }
 * @outputs {
 *   success, compositionPattern, phasesExecuted, audit, design, costEstimate,
 *   migrationPlan, iacScripts, diagrams, architectureDoc, qualityReview,
 *   qualityScore, metadata
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROCESS
// ═══════════════════════════════════════════════════════════════════════════════

export async function process(inputs, ctx) {
  const {
    projectIdentifier = '',
    cloudProvider = 'gcp',
    targetRegion = '',
    slaTarget = '99.9%',
    budgetCeiling = 100,
    currentArchitecture = {
      services: [],
      description: ''
    },
    diagramConfig = {
      enabled: true,
      outputDir: 'docs/architecture',
      generateCurrentState: true,
      generateTargetState: true
    },
    compositionPattern = 'full-pipeline'
  } = inputs;

  // Provider label for prompts
  const providerLabel = {
    gcp: 'Google Cloud Platform (GCP)',
    aws: 'Amazon Web Services (AWS)',
    azure: 'Microsoft Azure'
  }[cloudProvider] || cloudProvider;

  // Diagram skill name based on provider
  const diagramSkill = {
    gcp: 'generating-gcp-diagrams',
    aws: 'generating-aws-diagrams',
    azure: null // No Azure diagram skill yet
  }[cloudProvider];

  const output = {
    success: false,
    compositionPattern,
    phasesExecuted: [],
    audit: null,
    design: null,
    costEstimate: null,
    migrationPlan: null,
    iacScripts: null,
    diagrams: null,
    architectureDoc: null,
    qualityReview: null,
    qualityScore: 0,
    metadata: {
      processId: 'cloud-ha-architecture-plan',
      timestamp: null
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPOSITION PATTERN ROUTING
  // ═══════════════════════════════════════════════════════════════════════════
  //
  //   full-pipeline ------> phases 1-8  (complete HA planning)
  //   audit-only ----------> phase 1     (gap analysis only)
  //   design-and-plan -----> phases 1-5  (audit through IaC, no diagrams/doc)
  //   diagrams-only -------> phase 6     (generate diagrams from description)

  const runAudit = ['full-pipeline', 'audit-only', 'design-and-plan'].includes(compositionPattern);
  const runDesign = ['full-pipeline', 'design-and-plan'].includes(compositionPattern);
  const runCost = ['full-pipeline', 'design-and-plan'].includes(compositionPattern);
  const runMigration = ['full-pipeline', 'design-and-plan'].includes(compositionPattern);
  const runIaC = ['full-pipeline', 'design-and-plan'].includes(compositionPattern);
  const runDiagrams = ['full-pipeline', 'diagrams-only'].includes(compositionPattern) && diagramConfig.enabled;
  const runDoc = compositionPattern === 'full-pipeline';
  const runQuality = compositionPattern === 'full-pipeline';

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Infrastructure Audit & Gap Analysis
  // ═══════════════════════════════════════════════════════════════════════════

  if (runAudit) {
    ctx.log('Phase 1: Auditing current infrastructure for HA gaps...');

    let auditResult = await ctx.task(auditCurrentInfraTask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      currentArchitecture
    });
    output.audit = auditResult;
      let lastFeedback_phase1Review = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_phase1Review) {
        auditResult = await ctx.task(auditCurrentInfraTask, { ...{
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      currentArchitecture
    }, feedback: lastFeedback_phase1Review, attempt: attempt + 1 });
      }
  const phase1Review = await ctx.breakpoint({
      question: `Found ${auditResult.gapCount || 'N'} HA gaps across ` +
        `${auditResult.serviceCount || 'N'} services. Review audit before designing target architecture?`,
      title: 'Infrastructure Audit Review',
      context: {
        runId: ctx.runId,
        gapCount: auditResult.gapCount,
        summary: auditResult.summary
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_phase1Review || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (phase1Review.approved) break;
      lastFeedback_phase1Review = phase1Review.response || phase1Review.feedback || 'Changes requested';
    } }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: HA Architecture Design (Compute, Data, Network)
  // ═══════════════════════════════════════════════════════════════════════════

  if (runDesign) {
    ctx.log('Phase 2a: Designing compute tier HA...');
    const computeHA = await ctx.task(designComputeHATask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      budgetCeiling,
      audit: output.audit
    });

    ctx.log('Phase 2b: Designing data tier HA...');
    const dataHA = await ctx.task(designDataHATask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      budgetCeiling,
      audit: output.audit
    });

    ctx.log('Phase 2c: Designing network & observability HA...');
    let networkHA = await ctx.task(designNetworkHATask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      budgetCeiling,
      audit: output.audit
    });

    output.design = { compute: computeHA, data: dataHA, network: networkHA };
      let lastFeedback_phase2Review = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_phase2Review) {
        networkHA = await ctx.task(designNetworkHATask, { ...{
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      budgetCeiling,
      audit: output.audit
    }, feedback: lastFeedback_phase2Review, attempt: attempt + 1 });
      }
  const phase2Review = await ctx.breakpoint({
      question: 'Review the 3 HA design tracks (Compute, Data, Network). Approve before cost analysis?',
      title: 'HA Architecture Design Review',
      context: {
        runId: ctx.runId,
        summary: `Compute: ${computeHA.summary || 'done'}\nData: ${dataHA.summary || 'done'}\nNetwork: ${networkHA.summary || 'done'}`
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_phase2Review || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (phase2Review.approved) break;
      lastFeedback_phase2Review = phase2Review.response || phase2Review.feedback || 'Changes requested';
    } }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Cost Estimation & Optimization
  // ═══════════════════════════════════════════════════════════════════════════

  if (runCost) {
    ctx.log('Phase 3: Estimating costs...');

    const costResult = await ctx.task(estimateCostTask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      budgetCeiling,
      audit: output.audit,
      design: output.design
    });
    output.costEstimate = costResult;
    output.phasesExecuted.push('cost-estimation');
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Migration Plan
  // ═══════════════════════════════════════════════════════════════════════════

  if (runMigration) {
    ctx.log('Phase 4: Creating migration plan...');

    const migrationResult = await ctx.task(createMigrationPlanTask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      audit: output.audit,
      design: output.design,
      costEstimate: output.costEstimate
    });
    output.migrationPlan = migrationResult;
    output.phasesExecuted.push('migration-plan');
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: IaC Script Generation
  // ═══════════════════════════════════════════════════════════════════════════

  if (runIaC) {
    ctx.log('Phase 5: Generating IaC scripts...');

    const iacResult = await ctx.task(generateIaCTask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      audit: output.audit,
      design: output.design,
      migrationPlan: output.migrationPlan
    });
    output.iacScripts = iacResult;
    output.phasesExecuted.push('iac-generation');
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: Architecture Diagram Generation
  // ═══════════════════════════════════════════════════════════════════════════

  if (runDiagrams) {
    ctx.log('Phase 6: Generating architecture diagrams...');

    if (diagramSkill) {
      // Use the provider-specific diagram skill
      const diagramResult = await ctx.task(generateDiagramsSkillTask, {
        cloudProvider,
        providerLabel,
        diagramSkill,
        diagramConfig,
        projectIdentifier,
        targetRegion,
        currentArchitecture,
        audit: output.audit,
        design: output.design
      });
      output.diagrams = diagramResult;
    } else {
      // Fallback: generate ASCII diagrams via agent
      ctx.log(`No diagram skill available for ${cloudProvider}. Generating ASCII diagrams...`);
      const diagramResult = await ctx.task(generateDiagramsAgentTask, {
        cloudProvider,
        providerLabel,
        diagramConfig,
        projectIdentifier,
        targetRegion,
        currentArchitecture,
        audit: output.audit,
        design: output.design
      });
      output.diagrams = diagramResult;
    }
    output.phasesExecuted.push('diagrams');
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: Architecture Document Compilation
  // ═══════════════════════════════════════════════════════════════════════════

  if (runDoc) {
    ctx.log('Phase 7: Compiling architecture document...');

    const docResult = await ctx.task(compileArchitectureDocTask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      targetRegion,
      slaTarget,
      budgetCeiling,
      audit: output.audit,
      design: output.design,
      costEstimate: output.costEstimate,
      migrationPlan: output.migrationPlan,
      iacScripts: output.iacScripts,
      diagrams: output.diagrams
    });
    output.architectureDoc = docResult;
    output.phasesExecuted.push('architecture-doc');
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: Quality Review
  // ═══════════════════════════════════════════════════════════════════════════

  if (runQuality) {
    ctx.log('Phase 8: Quality review...');

    let qualityResult = await ctx.task(qualityReviewTask, {
      projectIdentifier,
      cloudProvider,
      providerLabel,
      slaTarget,
      budgetCeiling,
      audit: output.audit,
      design: output.design,
      costEstimate: output.costEstimate,
      migrationPlan: output.migrationPlan,
      iacScripts: output.iacScripts,
      architectureDoc: output.architectureDoc,
      phasesExecuted: output.phasesExecuted
    });
    output.qualityReview = qualityResult;
    output.qualityScore = qualityResult.score || 0;
      let lastFeedback_finalApproval = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_finalApproval) {
        qualityResult = await ctx.task(qualityReviewTask, { ...{
      projectIdentifier,
      cloudProvider,
      providerLabel,
      slaTarget,
      budgetCeiling,
      audit: output.audit,
      design: output.design,
      costEstimate: output.costEstimate,
      migrationPlan: output.migrationPlan,
      iacScripts: output.iacScripts,
      architectureDoc: output.architectureDoc,
      phasesExecuted: output.phasesExecuted
    }, feedback: lastFeedback_finalApproval, attempt: attempt + 1 });
      }
  const finalApproval = await ctx.breakpoint({
      question: `Architecture plan scored ${qualityResult.score || 'N/A'}/100. Approve final deliverables?`,
      title: 'Final Architecture Plan Approval',
      context: {
        runId: ctx.runId,
        score: qualityResult.score,
        summary: qualityResult.summary
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_finalApproval || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (finalApproval.approved) break;
      lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
    } }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINALIZE
  // ═══════════════════════════════════════════════════════════════════════════

  output.success = true;
  output.metadata.timestamp = ctx.now();
  return output;
}
  // ═══════════════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Phase 1: Infrastructure Audit ───────────────────────────────────────────

export const auditCurrentInfraTask = defineTask('audit-current-infra', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit current infrastructure for HA gaps',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} Solutions Architect specializing in high availability`,
      task: `Audit the following cloud infrastructure and identify ALL high-availability gaps.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
SLA TARGET: ${args.slaTarget}

CURRENT ARCHITECTURE:
${args.currentArchitecture.description || '(No description provided)'}

SERVICES:
${JSON.stringify(args.currentArchitecture.services || [], null, 2)}

DELIVERABLE — produce a structured audit with:
1. Service inventory with current HA status (GOOD / AT_RISK / DEGRADED / CRITICAL)
2. Gap analysis: what is missing to achieve ${args.slaTarget} SLA
3. Risk matrix: severity x likelihood for each gap (scored 1-10)
4. Priority-ordered list of remediations
5. Summary with total gap count and service count`,
      instructions: [
        'Analyze each service for single points of failure',
        'Identify cross-region or cross-AZ latency issues',
        'Check for missing health checks, monitoring, and alerting',
        'Assess backup and disaster recovery gaps',
        'Evaluate cold start and scale-to-zero impact on availability',
        'Check for missing auto-scaling configurations',
        'Assess deployment pipeline resilience',
        'Produce a priority-ordered gap list with severity ratings'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'gaps', 'gapCount', 'serviceCount', 'riskMatrix', 'remediations', 'summary'],
      properties: {
        services: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } },
        gapCount: { type: 'number' },
        serviceCount: { type: 'number' },
        riskMatrix: { type: 'array', items: { type: 'object' } },
        remediations: { type: 'array', items: { type: 'object' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 2a: Compute HA Design ────────────────────────────────────────────

export const designComputeHATask = defineTask('design-compute-ha', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design compute tier HA',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} Compute HA specialist`,
      task: `Design the compute tier HA architecture.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
SLA TARGET: ${args.slaTarget}
BUDGET CEILING: $${args.budgetCeiling}/month (total for ALL HA improvements)

AUDIT RESULTS (gaps to address):
${args.audit?.summary || 'No audit available'}

DESIGN REQUIREMENTS:
- Instance / container scaling strategy (min instances, auto-scaling, right-sizing)
- Health check and probe configuration (startup, liveness, readiness)
- Deployment strategy (canary, blue-green, rolling)
- CPU and memory allocation strategy
- Concurrency and timeout settings
- Graceful shutdown handling
- Region migration plan (if services need to move)

Produce provider-specific CLI commands for each configuration change.`,
      instructions: [
        'Design scaling policies for each compute service',
        'Configure health check endpoints and intervals',
        'Plan region migration if services are in the wrong region',
        'Set appropriate CPU/memory allocation',
        'Design deployment strategy with traffic splitting',
        'Specify exact CLI commands for each change',
        'Keep compute cost within budget ceiling'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'commands', 'summary'],
      properties: {
        services: { type: 'array', items: { type: 'object' } },
        commands: { type: 'array', items: { type: 'string' } },
        deploymentStrategy: { type: 'object' },
        estimatedMonthlyCost: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 2b: Data HA Design ───────────────────────────────────────────────

export const designDataHATask = defineTask('design-data-ha', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data tier HA',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} Data tier HA specialist`,
      task: `Design the data tier HA architecture.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
SLA TARGET: ${args.slaTarget}
BUDGET CEILING: $${args.budgetCeiling}/month (total for ALL HA improvements)

AUDIT RESULTS (gaps to address):
${args.audit?.summary || 'No audit available'}

DESIGN REQUIREMENTS:
- Automated backup strategy (frequency, retention, verification)
- Point-in-time recovery (PITR) assessment
- Regional vs multi-region replication decision
- Data export/import strategy for disaster recovery
- Index optimization recommendations
- Encryption and access control review

Produce provider-specific CLI commands for each configuration change.`,
      instructions: [
        'Design automated backup schedule with appropriate tooling',
        'Evaluate point-in-time recovery options',
        'Assess regional vs multi-region tradeoffs',
        'Design backup retention and lifecycle policy',
        'Plan backup verification and restore testing',
        'Design monitoring for database availability and latency',
        'Specify exact CLI commands',
        'Keep data tier cost within budget'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['backupStrategy', 'recoveryPlan', 'commands', 'summary'],
      properties: {
        backupStrategy: { type: 'object' },
        recoveryPlan: { type: 'object' },
        replicationDecision: { type: 'string' },
        commands: { type: 'array', items: { type: 'string' } },
        estimatedMonthlyCost: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 2c: Network & Observability HA Design ────────────────────────────

export const designNetworkHATask = defineTask('design-network-ha', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design network & observability HA',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} Network & Observability HA specialist`,
      task: `Design the network and observability HA architecture.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
SLA TARGET: ${args.slaTarget}
BUDGET CEILING: $${args.budgetCeiling}/month (total for ALL HA improvements)

AUDIT RESULTS (gaps to address):
${args.audit?.summary || 'No audit available'}

DESIGN REQUIREMENTS:
- Uptime/health checks for all service endpoints
- Alert policies (downtime, error rate, latency thresholds)
- Monitoring dashboards for key metrics
- WAF / DDoS protection assessment
- SLO / SLI / error budget definitions
- Log-based metrics for application errors
- Notification channels (email, Slack, PagerDuty, etc.)

Produce provider-specific CLI commands for each setup.`,
      instructions: [
        'Design uptime check configuration for each service',
        'Create alert policy definitions',
        'Design monitoring dashboard layout',
        'Evaluate WAF/DDoS protection cost-benefit',
        'Define SLOs and SLIs for each service',
        'Design log-based metrics for error tracking',
        'Plan notification channels',
        'Keep monitoring cost within budget',
        'Specify exact CLI commands'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['uptimeChecks', 'alertPolicies', 'slos', 'commands', 'summary'],
      properties: {
        uptimeChecks: { type: 'array', items: { type: 'object' } },
        alertPolicies: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        slos: { type: 'array', items: { type: 'object' } },
        wafAssessment: { type: 'object' },
        commands: { type: 'array', items: { type: 'string' } },
        estimatedMonthlyCost: { type: 'number' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 3: Cost Estimation ───────────────────────────────────────────────

export const estimateCostTask = defineTask('estimate-cost', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate HA architecture costs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} FinOps cost analyst`,
      task: `Produce a detailed monthly cost estimate for the proposed HA architecture.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
BUDGET CEILING: $${args.budgetCeiling}/month

HA DESIGN SUMMARY:
- Compute: ${args.design?.compute?.summary || 'N/A'}
- Data: ${args.design?.data?.summary || 'N/A'}
- Network: ${args.design?.network?.summary || 'N/A'}

Estimate costs for:
1. COMPUTE — scaling, min instances, always-on allocation
2. DATA — backups, replication, PITR, storage
3. MONITORING — uptime checks, alert policies, log storage, dashboards
4. NETWORK — WAF/DDoS protection, egress, load balancing

Include:
- Line-item breakdown with unit pricing
- Total monthly cost
- Current baseline cost
- Delta (new - current)
- Whether total is within budget ceiling
- Priority cuts if over budget`,
      instructions: [
        'Calculate compute costs using provider pricing for the target region',
        'Calculate data tier costs (backup storage, replication)',
        'Calculate monitoring and alerting costs',
        'Calculate network costs (WAF, egress)',
        'Sum total and compare to budget ceiling',
        'If over budget, suggest priority cuts to get within budget',
        'Use actual provider pricing for the target region'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['lineItems', 'totalMonthlyCost', 'withinBudget', 'summary'],
      properties: {
        lineItems: { type: 'array', items: { type: 'object' } },
        totalMonthlyCost: { type: 'number' },
        currentMonthlyCost: { type: 'number' },
        delta: { type: 'number' },
        withinBudget: { type: 'boolean' },
        priorityCuts: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 4: Migration Plan ────────────────────────────────────────────────

export const createMigrationPlanTask = defineTask('create-migration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create migration / implementation plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} migration specialist`,
      task: `Create a step-by-step migration plan to move from the current architecture to the HA target.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
SLA TARGET: ${args.slaTarget}

AUDIT SUMMARY:
${args.audit?.summary || 'N/A'}

HA DESIGN SUMMARY:
- Compute: ${args.design?.compute?.summary || 'N/A'}
- Data: ${args.design?.data?.summary || 'N/A'}
- Network: ${args.design?.network?.summary || 'N/A'}

COST ESTIMATE: $${args.costEstimate?.totalMonthlyCost || 'N/A'}/month

KEY CONSTRAINTS:
- Zero-downtime migration required
- Must maintain existing CI/CD pipeline
- Each phase must have a rollback strategy
- Validation/smoke test steps after each phase

Produce a phased plan with:
1. Clear milestones and dependencies
2. Rollback strategy for each phase
3. Estimated time per phase
4. Risk identification and mitigations
5. Validation steps`,
      instructions: [
        'Create phased migration plan with clear milestones',
        'Include rollback strategy for each phase',
        'Identify dependencies between steps',
        'Estimate time for each phase',
        'Flag risks and mitigations',
        'Include validation/smoke test steps',
        'Account for DNS propagation and caching',
        'Plan for CI/CD pipeline updates'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalEstimatedTime', 'risks', 'summary'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        totalEstimatedTime: { type: 'string' },
        risks: { type: 'array', items: { type: 'object' } },
        rollbackPlan: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 5: IaC Script Generation ─────────────────────────────────────────

export const generateIaCTask = defineTask('generate-iac', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate IaC scripts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} Infrastructure-as-Code specialist`,
      task: `Generate executable IaC scripts for the HA architecture migration.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}

HA DESIGN SUMMARY:
- Compute: ${args.design?.compute?.summary || 'N/A'}
- Data: ${args.design?.data?.summary || 'N/A'}
- Network: ${args.design?.network?.summary || 'N/A'}

MIGRATION PLAN:
${args.migrationPlan?.summary || 'N/A'}

Generate the following artifacts:

1. **deploy-ha.sh** — Master deployment script that applies all HA configurations:
   compute scaling, health checks, auto-scaling, data backups, monitoring setup.

2. **monitoring-setup.sh** — Script to configure uptime checks, alert policies,
   notification channels, log-based metrics.

3. **backup-setup.sh** — Script to configure automated backups, retention policies,
   and backup verification.

4. **CI/CD workflow updates** — Updated CI/CD pipeline configuration for the
   new region and HA settings.

All scripts should be:
- Idempotent (safe to re-run)
- Well-commented with section headers
- Using provider CLI commands (not Terraform unless appropriate)
- Including error handling and validation steps`,
      instructions: [
        'Generate executable shell scripts with error handling',
        'Use provider CLI for all infrastructure changes',
        'Make scripts idempotent (check before create)',
        'Include validation steps after each major change',
        'Generate updated CI/CD workflow with region change',
        'Add proper comments and section headers',
        'Include variable declarations at top of each script',
        'Generate a README with execution instructions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'summary'],
      properties: {
        scripts: { type: 'array', items: { type: 'object' } },
        workflowUpdates: { type: 'object' },
        readme: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 6a: Diagram Generation via Skill ─────────────────────────────────

export const generateDiagramsSkillTask = defineTask('generate-diagrams-skill', (args, taskCtx) => ({
  kind: 'skill',
  title: `Generate architecture diagrams (${args.cloudProvider.toUpperCase()})`,
  skill: {
    name: args.diagramSkill,
    context: {
      task: 'Create DrawIO from Description',
      instructions: [
        args.diagramConfig.generateCurrentState
          ? 'Generate a "Current State" architecture diagram showing the existing infrastructure: ' +
            (args.currentArchitecture?.description ||
              JSON.stringify(args.currentArchitecture?.services || []))
          : null,
        args.diagramConfig.generateTargetState && args.design
          ? 'Generate a "Target State" architecture diagram showing the proposed HA architecture with: ' +
            `Compute: ${args.design?.compute?.summary || 'N/A'}, ` +
            `Data: ${args.design?.data?.summary || 'N/A'}, ` +
            `Network: ${args.design?.network?.summary || 'N/A'}`
          : null,
        `Save diagrams to ${args.diagramConfig.outputDir}/`,
        `Use the ${args.cloudProvider.toUpperCase()} icon set`,
        'Follow DrawIO best practices for layout and spacing',
        'Include proper labels, connection arrows, and grouping containers'
      ].filter(Boolean),
      projectIdentifier: args.projectIdentifier,
      targetRegion: args.targetRegion
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 6b: Diagram Generation via Agent (fallback) ──────────────────────

export const generateDiagramsAgentTask = defineTask('generate-diagrams-agent', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate architecture diagrams (${args.cloudProvider.toUpperCase()} — ASCII fallback)`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.providerLabel} architecture diagram specialist`,
      task: `Generate detailed ASCII architecture diagrams for the infrastructure.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}

CURRENT ARCHITECTURE:
${args.currentArchitecture?.description || JSON.stringify(args.currentArchitecture?.services || [])}

${args.design ? `TARGET HA ARCHITECTURE:
- Compute: ${args.design.compute?.summary || 'N/A'}
- Data: ${args.design.data?.summary || 'N/A'}
- Network: ${args.design.network?.summary || 'N/A'}` : ''}

Generate:
${args.diagramConfig.generateCurrentState ? '1. Current State architecture diagram (ASCII art)' : ''}
${args.diagramConfig.generateTargetState ? '2. Target State HA architecture diagram (ASCII art)' : ''}

Each diagram should show:
- Service components with their regions/zones
- Data flows and connections between services
- External entry points (users, APIs)
- Grouping by tier (compute, data, network)`,
      instructions: [
        'Create clear, well-formatted ASCII architecture diagrams',
        'Show service groupings with box-drawing characters',
        'Include arrows for data flow direction',
        'Label all services with their type and region',
        'Show external entry points at the top',
        'Group services by tier (frontend, compute, data, monitoring)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['diagrams', 'summary'],
      properties: {
        diagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 7: Architecture Document Compilation ─────────────────────────────

export const compileArchitectureDocTask = defineTask('compile-architecture-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile final architecture document',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical architect and technical writer',
      task: `Compile a comprehensive HA Architecture Document.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
TARGET REGION: ${args.targetRegion}
SLA TARGET: ${args.slaTarget}
BUDGET CEILING: $${args.budgetCeiling}/month

ALL PHASE RESULTS are provided in the context.

Produce a single comprehensive markdown document with these sections:

1. **Executive Summary** — Problem, solution, key metrics
2. **Current Architecture** — Service inventory, identified gaps, diagram reference
3. **Target Architecture** — Service inventory with HA configs, diagram reference
4. **Region Strategy** — Why the target region, latency improvement, migration approach
5. **Compute HA Design** — Scaling, health checks, deployment strategy
6. **Data HA Design** — Backups, PITR, recovery procedures
7. **Network & Monitoring** — Uptime checks, alerts, dashboards, SLOs/SLIs
8. **Cost Analysis** — Line-item breakdown, total, comparison to current
9. **Migration Plan** — Phased steps, timeline, rollback strategy
10. **Risk Assessment** — Risk matrix, mitigations
11. **IaC Scripts Reference** — List of scripts and their purpose
12. **Appendix** — CLI commands reference, configuration values

Make it implementation-ready and actionable.`,
      instructions: [
        'Include architecture diagrams or references to generated diagram files',
        'Include specific service configurations and values',
        'Reference actual resource names and regions',
        'Make the document self-contained and actionable',
        'Include a clear before/after comparison',
        'Highlight the key improvements from HA changes',
        'Keep it professional but concise'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'summary'],
      properties: {
        document: { type: 'string' },
        diagramReferences: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ─── Phase 8: Quality Review ────────────────────────────────────────────────

export const qualityReviewTask = defineTask('quality-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality review of architecture plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `Senior cloud architect reviewing an HA architecture plan for ${args.providerLabel}`,
      task: `Review the HA architecture plan for completeness, correctness, and quality.

CLOUD PROVIDER: ${args.providerLabel}
PROJECT/ACCOUNT: ${args.projectIdentifier}
SLA TARGET: ${args.slaTarget}
BUDGET CEILING: $${args.budgetCeiling}/month

PHASES EXECUTED: ${args.phasesExecuted?.join(', ') || 'N/A'}

Score the plan 0-100 on these dimensions:
1. **Completeness** (25pts): Does it cover all services? Compute, Data, Network, Monitoring?
2. **Correctness** (25pts): Are CLI commands correct? Are service configurations valid for the target region?
3. **Cost-Effectiveness** (20pts): Is it within budget? Are there unnecessary costs?
4. **Actionability** (15pts): Can someone execute this plan? Are steps clear and ordered?
5. **Risk Coverage** (15pts): Are risks identified? Are rollback strategies defined?

Flag any:
- Invalid CLI commands or parameters
- Services not available in the target region
- Missing HA considerations
- Unrealistic cost estimates
- Missing rollback steps
- Inconsistencies between phases`,
      instructions: [
        'Review each phase result for correctness',
        'Validate CLI commands are syntactically correct',
        'Check that the target region supports all proposed services',
        'Verify cost estimates are reasonable',
        'Check migration plan for gaps',
        'Score each dimension and calculate total',
        'List specific issues found with severity',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'dimensions', 'issues', 'summary'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        dimensions: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
