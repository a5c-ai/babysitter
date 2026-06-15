/**
 * @process specializations/observability/sre/sre-gcp
 * @description GCP-specialized SRE persona. Extends sre-base with Cloud Monitoring,
 *   Cloud Logging, multi-region + load balancing, Backup for GKE, and
 *   Deployment Manager/Terraform IaC.
 * @inputs { incident?: object, system?: object }
 * @outputs { success: boolean, report: object }
 *
 * Source: a5c-ai/registry/prompts/sre/gcp-sre-agent.prompt.md ({{base-prompt}} + GCP specifics)
 * @graph
 *   domains: [domain:observability]
 *   skillAreas: [skill-area:incident-management, skill-area:cloud-infrastructure]
 *   topics: [topic:slo-sli, topic:incident-management, topic:gcp]
 *   roles: [role:site-reliability-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SRE_GCP_PROMPT = [
  'You are a GCP Site Reliability Engineer (SRE) Agent specialized in GCP.',
  'You operate with a pre-authenticated and pre-configured gcloud CLI environment.',
  '',
  'GCP-specific Responsibilities:',
  '1. GCP Auth & CLI Automation — gcloud with pre-configured credentials.',
  '2. Incident Response — Cloud Monitoring + Cloud Logging for investigation.',
  '3. Monitoring & Alerting — Cloud Monitoring alerting policies and dashboards.',
  '4. Reliability & Resilience — multi-region deployments, load balancing, failover; Cloud Storage + Backup for GKE.',
  '5. IaC — Deployment Manager or Terraform; integrate into CI/CD.',
  '',
  'Baseline SRE discipline: SLO/SLI/error-budget, runbook dispatch, reversible remediations, postmortems.',
].join('\n');

const gcpInvestigateTask = defineTask(
  'sre-gcp-investigate',
  async ({ incident, system }, ctx) => {
    return ctx.agent({
      title: 'SRE-GCP: investigate via Cloud Monitoring/Logging',
      prompt: [
        SRE_GCP_PROMPT,
        '',
        'Task: Investigate via Cloud Monitoring + Logging. Identify affected SLIs,',
        'error-budget burn, suspected root cause, remediation; flag Terraform drift.',
        '',
        `Incident: ${JSON.stringify(incident ?? {}, null, 2)}`,
        `System context: ${JSON.stringify(system ?? {}, null, 2)}`,
        '',
        'Return JSON: { findings, suspectResources, rootCauseHypothesis, remediation, iacChangeNeeded }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE-GCP investigate', labels: ['a5c', 'sre', 'gcp'] },
);

const gcpRemediateTask = defineTask(
  'sre-gcp-remediate',
  async ({ findings, remediation }, ctx) => {
    return ctx.agent({
      title: 'SRE-GCP: execute remediation',
      prompt: [
        SRE_GCP_PROMPT,
        '',
        'Task: Execute remediation via gcloud and/or an IaC PR (Deployment Manager/Terraform).',
        'Favor reversible changes. Update alerting policies if detection lagged.',
        '',
        `Findings: ${JSON.stringify(findings ?? {}, null, 2)}`,
        `Remediation plan: ${JSON.stringify(remediation ?? {}, null, 2)}`,
        '',
        'Return JSON: { actionsTaken, iacPrUrl, verified, residualRisk }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE-GCP remediate', labels: ['a5c', 'sre', 'gcp', 'remediation'] },
);

export async function process(inputs, ctx) {
  const { incident = {}, system = {} } = inputs ?? {};
  const findings = await ctx.task(gcpInvestigateTask, { incident, system });
  const remediation = await ctx.task(gcpRemediateTask, {
    findings,
    remediation: findings?.remediation ?? {},
  });
  return { success: true, report: { findings, remediation } };
}
