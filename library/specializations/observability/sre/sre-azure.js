/**
 * @process specializations/observability/sre/sre-azure
 * @description Azure-specialized SRE persona. Extends sre-base with Azure Monitor,
 *   App Insights, Log Analytics, availability zones, Traffic Manager, Site Recovery,
 *   and ARM/Bicep IaC. Includes AKS deploy.sh scaffolding guidance from the source.
 * @inputs { incident?: object, system?: object }
 * @outputs { success: boolean, report: object }
 *
 * Source: a5c-ai/registry/prompts/sre/azure-sre-engineer-agent.prompt.md
 * @graph
 *   domains: [domain:observability]
 *   skillAreas: [skill-area:incident-management, skill-area:cloud-infrastructure]
 *   topics: [topic:slo-sli, topic:incident-management, topic:azure]
 *   roles: [role:site-reliability-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SRE_AZURE_PROMPT = [
  'You are an Azure Site Reliability Engineer (SRE) Agent specialized in Azure.',
  'You operate with a pre-authenticated and pre-configured Azure CLI environment (service principal).',
  '',
  'Azure-specific Responsibilities:',
  '1. Azure Auth & CLI Automation — az cli with service-principal credentials.',
  '2. Incident Response — `az monitor` for metrics, logs, diagnostics.',
  '3. Monitoring & Alerting — Azure Monitor, Application Insights, Log Analytics.',
  '4. Reliability & Resilience — availability sets/zones, Traffic Manager, Site Recovery.',
  '5. IaC — ARM templates or Bicep; integrate into CI/CD.',
  '',
  'For new-app deployments, extend deploy.sh to:',
  '  - az login --service-principal with $AZURE_APPLICATION_CLIENT_ID / $AZURE_APPLICATION_CLIENT_SECRET / $AZURE_TENANT_ID',
  '  - az account set --subscription $AZURE_SUBSCRIPTION_ID',
  '  - az aks get-credentials -g $AZURE_RESOURCE_GROUP_NAME -n $AZURE_AKS_CLUSTER_NAME',
  '  - docker build/push and kubectl apply of manifests (create manifests if absent).',
  '',
  'Baseline SRE discipline: SLO/SLI/error-budget, runbook dispatch, reversible remediations, postmortems.',
].join('\n');

const azureInvestigateTask = defineTask(
  'sre-azure-investigate',
  async ({ incident, system }, ctx) => {
    return ctx.agent({
      title: 'SRE-Azure: investigate via az monitor',
      prompt: [
        SRE_AZURE_PROMPT,
        '',
        'Task: Investigate via `az monitor` + App Insights. Identify affected SLIs,',
        'error-budget burn, suspected root cause, remediation; flag ARM/Bicep drift.',
        '',
        `Incident: ${JSON.stringify(incident ?? {}, null, 2)}`,
        `System context: ${JSON.stringify(system ?? {}, null, 2)}`,
        '',
        'Return JSON: { findings, suspectResources, rootCauseHypothesis, remediation, iacChangeNeeded }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE-Azure investigate', labels: ['a5c', 'sre', 'azure'] },
);

const azureRemediateTask = defineTask(
  'sre-azure-remediate',
  async ({ findings, remediation }, ctx) => {
    return ctx.agent({
      title: 'SRE-Azure: execute remediation',
      prompt: [
        SRE_AZURE_PROMPT,
        '',
        'Task: Execute remediation via az cli and/or an IaC PR (ARM/Bicep).',
        'Favor reversible changes. Update Azure Monitor alert rules if detection lagged.',
        '',
        `Findings: ${JSON.stringify(findings ?? {}, null, 2)}`,
        `Remediation plan: ${JSON.stringify(remediation ?? {}, null, 2)}`,
        '',
        'Return JSON: { actionsTaken, iacPrUrl, verified, residualRisk }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE-Azure remediate', labels: ['a5c', 'sre', 'azure', 'remediation'] },
);

export async function process(inputs, ctx) {
  const { incident = {}, system = {} } = inputs ?? {};
  const findings = await ctx.task(azureInvestigateTask, { incident, system });
  const remediation = await ctx.task(azureRemediateTask, {
    findings,
    remediation: findings?.remediation ?? {},
  });
  return { success: true, report: { findings, remediation } };
}
