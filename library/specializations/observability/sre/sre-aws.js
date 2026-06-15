/**
 * @process specializations/observability/sre/sre-aws
 * @description AWS-specialized SRE persona. Extends sre-base with CloudWatch, CloudTrail,
 *   Auto Scaling, multi-AZ, Route 53 failover, and CloudFormation/Terraform IaC.
 * @inputs { incident?: object, system?: object }
 * @outputs { success: boolean, report: object }
 *
 * Source: a5c-ai/registry/prompts/sre/aws-sre-agent.prompt.md ({{base-prompt}} + AWS specifics)
 * @graph
 *   domains: [domain:observability]
 *   skillAreas: [skill-area:incident-management, skill-area:cloud-infrastructure]
 *   topics: [topic:slo-sli, topic:incident-management, topic:aws]
 *   roles: [role:site-reliability-engineer, role:platform-engineer]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SRE_AWS_PROMPT = [
  'You are an AWS Site Reliability Engineer (SRE) Agent specialized in AWS.',
  'You operate with a pre-authenticated and pre-configured AWS CLI environment.',
  '',
  'AWS-specific Responsibilities:',
  '1. AWS Auth & CLI Automation — aws cli with pre-configured credentials; provisioning, config, compliance.',
  '2. Incident Response — diagnose service interrupts; CloudWatch logs + metrics.',
  '3. Monitoring & Alerting — CloudWatch Alarms, dashboards, CloudTrail; tune alerts for SLIs.',
  '4. Reliability & Resilience — Auto Scaling, ELB, multi-AZ; AWS Backup + Route 53 failover for DR.',
  '5. IaC — CloudFormation or Terraform; integrate into CI/CD.',
  '',
  'Baseline SRE discipline: SLO/SLI/error-budget, runbook dispatch, reversible remediations, postmortems.',
].join('\n');

const awsInvestigateTask = defineTask(
  'sre-aws-investigate',
  async ({ incident, system }, ctx) => {
    return ctx.agent({
      title: 'SRE-AWS: investigate via CloudWatch/CloudTrail',
      prompt: [
        SRE_AWS_PROMPT,
        '',
        'Task: Investigate the incident using aws cli. Pull recent CloudWatch metrics/logs for',
        'affected resources, check CloudTrail for suspicious API calls, review Auto Scaling and',
        'load-balancer health. Identify affected SLIs + error-budget impact.',
        '',
        `Incident: ${JSON.stringify(incident ?? {}, null, 2)}`,
        `System context: ${JSON.stringify(system ?? {}, null, 2)}`,
        '',
        'Return JSON: { findings, suspectResources, rootCauseHypothesis, remediation, iacChangeNeeded }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE-AWS investigate', labels: ['a5c', 'sre', 'aws'] },
);

const awsRemediateTask = defineTask(
  'sre-aws-remediate',
  async ({ findings, remediation }, ctx) => {
    return ctx.agent({
      title: 'SRE-AWS: execute remediation',
      prompt: [
        SRE_AWS_PROMPT,
        '',
        'Task: Execute remediation via aws cli and/or an IaC PR (CloudFormation/Terraform).',
        'Favor reversible changes. Update CloudWatch alarms/dashboards if detection was late.',
        '',
        `Findings: ${JSON.stringify(findings ?? {}, null, 2)}`,
        `Remediation plan: ${JSON.stringify(remediation ?? {}, null, 2)}`,
        '',
        'Return JSON: { actionsTaken, iacPrUrl, verified, residualRisk }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'SRE-AWS remediate', labels: ['a5c', 'sre', 'aws', 'remediation'] },
);

export async function process(inputs, ctx) {
  const { incident = {}, system = {} } = inputs ?? {};
  const findings = await ctx.task(awsInvestigateTask, { incident, system });
  const remediation = await ctx.task(awsRemediateTask, {
    findings,
    remediation: findings?.remediation ?? {},
  });
  return { success: true, report: { findings, remediation } };
}
