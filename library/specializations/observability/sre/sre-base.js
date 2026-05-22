/**
 * @process specializations/observability/sre/sre-base
 * @description Site Reliability Engineering base persona. Enforces SLO/SLI/error-budget
 *   discipline, runbook dispatch, and incident-response rigor. Cloud-neutral; specialized
 *   by sre-aws / sre-azure / sre-gcp. Emits an incident-escalation breakpoint when the
 *   situation exceeds automated remediation.
 * @inputs { incident?: object, system?: object, runbooks?: string[] }
 * @outputs { success: boolean, diagnosis: object, escalated: boolean }
 *
 * Source: a5c-ai/registry/prompts/sre/sre-base-agent.prompt.md
 * @graph
 *   domains: [domain:observability]
 *   skillAreas: [skill-area:incident-management]
 *   topics: [topic:slo-sli, topic:incident-management]
 *   roles: [role:site-reliability-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SRE_BASE_PROMPT = [
  'You are a Site Reliability Engineering (SRE) Base Agent responsible for establishing and',
  'enforcing reliability and operational best practices across cloud environments. Core goals:',
  'high availability, scalability, performance, and rapid incident response.',
  '',
  'Core Responsibilities:',
  '1. Incident Response & Troubleshooting — diagnose/remediate production incidents; RCA + prevention.',
  '2. Monitoring & Observability — metrics, logs, traces; alerts and dashboards for proactive detection.',
  '3. Performance & Capacity Planning — optimize resource utilization; forecast scaling.',
  '4. Reliability Engineering — SLOs, SLIs, error budgets; redundancy, failover, DR.',
  '5. Automation & IaC — Terraform/ARM/CloudFormation; integrate reliability checks into CI/CD.',
].join('\n');

const diagnoseTask = defineTask(
  'sre-base-diagnose',
  async ({ incident, system, runbooks }, ctx) => {
    return ctx.agent({
      title: 'SRE base: diagnose incident',
      prompt: [
        SRE_BASE_PROMPT,
        '',
        'Task: Diagnose the incident. Identify affected SLIs, error-budget burn rate,',
        'suspected root cause, and the smallest safe remediation. If a runbook matches,',
        'dispatch it; otherwise propose a new one for later codification.',
        '',
        `Incident: ${JSON.stringify(incident ?? {}, null, 2)}`,
        `System context: ${JSON.stringify(system ?? {}, null, 2)}`,
        `Available runbooks: ${JSON.stringify(runbooks ?? [], null, 2)}`,
        '',
        'Return JSON: { rootCauseHypothesis, affectedSLIs, errorBudgetBurn, runbook, remediation, confidence }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE diagnose', labels: ['a5c', 'sre', 'incident'] },
);

const remediateTask = defineTask(
  'sre-base-remediate',
  async ({ incident, remediation }, ctx) => {
    return ctx.agent({
      title: 'SRE base: execute remediation',
      prompt: [
        SRE_BASE_PROMPT,
        '',
        'Task: Execute the proposed remediation with the least-blast-radius approach.',
        'Favor reversible actions. Record every change for the postmortem.',
        '',
        `Incident: ${JSON.stringify(incident ?? {}, null, 2)}`,
        `Remediation plan: ${JSON.stringify(remediation ?? {}, null, 2)}`,
        '',
        'Return JSON: { actionsTaken: string[], verified: boolean, residualRisk: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE remediate', labels: ['a5c', 'sre', 'remediation'] },
);

export async function process(inputs, ctx) {
  const { incident = {}, system = {}, runbooks = [] } = inputs ?? {};
  const diagnosis = await ctx.task(diagnoseTask, { incident, system, runbooks });

  const confidence = Number(diagnosis?.confidence ?? 0);
  const highImpact = diagnosis?.errorBudgetBurn === 'critical' || confidence < 0.5;

  let escalated = false;
  if (highImpact) {
    const gate = await ctx.breakpoint({
      title: 'SRE incident escalation',
      breakpointId: 'sre.base.escalate-incident',
      expert: 'owner',
      tags: ['sre', 'incident', 'escalation'],
      message: [
        'Automated diagnosis indicates critical error-budget burn or low confidence.',
        `Diagnosis: ${JSON.stringify(diagnosis, null, 2)}`,
        'Approve to proceed with automated remediation, or reject to escalate to on-call.',
      ].join('\n'),
    });
    escalated = !gate?.approved;
    if (escalated) {
      return { success: true, diagnosis, escalated: true };
    }
  }

  await ctx.task(remediateTask, { incident, remediation: diagnosis?.remediation ?? {} });
  return { success: true, diagnosis, escalated: false };
}
