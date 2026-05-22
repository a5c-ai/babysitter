/**
 * @process specializations/observability/incident-lifecycle
 * @description Full incident lifecycle as a single workflow: detect/intake → triage+severity → comms-cadence → diagnose → mitigate → verify-recovery → postmortem → action-item follow-through. Replaces separate detect/triage/postmortem role-split processes.
 * @inputs { signal: { source: "alert"|"user-report"|"cron"|"synthetic", ref: string, firstSeenAt: string, symptomSummary: string, impactedSurfaces?: string[] }, onCall?: { primary: string, secondary?: string }, commsChannels?: Array<{ kind: "slack"|"status-page"|"email", target: string }>, slo?: { mttdMinutes: number, mttrMinutes: number } }
 * @outputs { success: boolean, severity: "SEV1"|"SEV2"|"SEV3"|"SEV4"|"non-incident", mitigation: object, recoveryVerified: boolean, postmortemUrl?: string, actionItems: Array<object>, slaBreaches?: Array<string> }
 * @graph
 *   domains: [domain:observability]
 *   specializations: [specialization:observability]
 *   skillAreas: [skill-area:incident-response, skill-area:alerting-oncall, skill-area:observability-instrumentation, skill-area:sli-slo-management]
 *   workflows: [workflow:incident-response, workflow:on-call-rotation, workflow:post-mortem-review]
 *   roles: [role:sre, role:observability-engineer, role:devops-engineer, role:platform-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const triageTask = defineTask(
  'incident.triage',
  async ({ signal }, ctx) => {
    return ctx.agent({
      title: 'Triage signal + set severity',
      prompt: [
        'Triage the incoming signal. Is this an incident? If so, what severity?',
        `Signal: ${JSON.stringify(signal, null, 2)}`,
        'Severity matrix:',
        '- SEV1: user-facing outage on critical path OR data loss/corruption risk.',
        '- SEV2: significant degradation, workaround exists, ongoing user impact.',
        '- SEV3: partial degradation, limited user impact.',
        '- SEV4: internal-only, no user impact, cleanup-later.',
        '- non-incident: false alarm, duplicate, expected behavior.',
        'Return JSON: { severity, rationale, initialHypotheses: string[], impactedSurfaces: string[], needsStatusPage: boolean }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Triage', labels: ['observability', 'incident'] },
);

const commsTask = defineTask(
  'incident.comms',
  async ({ channel, phase, severity, status }, ctx) => {
    return ctx.agent({
      title: `${phase} comms → ${channel.kind}`,
      prompt: [
        `Post a ${phase} update for a ${severity} incident to ${channel.kind}:${channel.target}.`,
        `Current status: ${JSON.stringify(status, null, 2)}`,
        'Phases:',
        '- open: we are investigating; here\'s what\'s known and what\'s not.',
        '- update: what changed since last update; next update in N minutes.',
        '- mitigated: impact reduced; monitoring.',
        '- resolved: incident closed; link to postmortem when ready.',
        'Rules: no blame, no speculation stated as fact, concrete next-update time.',
        'Return JSON: { sent: boolean, messageId?: string, body: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Comms update', labels: ['observability', 'comms'] },
);

const diagnoseTask = defineTask(
  'incident.diagnose',
  async ({ signal, hypotheses, previousFindings }, ctx) => {
    return ctx.agent({
      title: 'Diagnose root cause',
      prompt: [
        'Diagnose the root cause. Pull logs, metrics, traces, recent deploys/config changes.',
        `Signal: ${JSON.stringify(signal, null, 2)}`,
        `Hypotheses to rule in/out: ${JSON.stringify(hypotheses)}`,
        `Previous findings (if iterating): ${JSON.stringify(previousFindings ?? null, null, 2)}`,
        'Return JSON: { rootCause?: string, confidence: "low"|"medium"|"high", evidence: Array<{ source, excerpt, weight }>, remainingHypotheses: string[], needsMoreSignal: boolean }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Diagnose', labels: ['observability', 'diagnose'] },
);

const mitigateTask = defineTask(
  'incident.mitigate',
  async ({ rootCause, severity }, ctx) => {
    return ctx.agent({
      title: 'Apply mitigation',
      prompt: [
        `Apply a mitigation for a ${severity} incident. Prefer reversible actions (rollback, feature-flag disable, traffic shift) over code fixes.`,
        `Root cause: ${rootCause}`,
        'Log every action taken with timestamp for the postmortem timeline.',
        'Return JSON: { actions: Array<{ action, timestamp, reversible: boolean, outcome }>, mitigated: boolean, mitigationSummary: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Mitigate', labels: ['observability', 'mitigate'] },
);

const verifyTask = defineTask(
  'incident.verify-recovery',
  async ({ mitigation, signal }, ctx) => {
    return ctx.agent({
      title: 'Verify recovery',
      prompt: [
        'Verify the symptoms described in the original signal are no longer reproducing.',
        `Original symptom: ${signal.symptomSummary}`,
        `Impacted surfaces: ${JSON.stringify(signal.impactedSurfaces ?? [])}`,
        `Mitigation: ${JSON.stringify(mitigation, null, 2)}`,
        'Re-run the failing probes or synthetic checks. Hold for at least one cycle to confirm stability.',
        'Return JSON: { recovered: boolean, probesRun: Array<{ name, passed, detail }>, stabilityWindowMinutes: number }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Verify recovery', labels: ['observability', 'recovery'] },
);

const postmortemTask = defineTask(
  'incident.postmortem',
  async ({ signal, severity, triage, diagnosis, mitigation, timeline }, ctx) => {
    return ctx.agent({
      title: 'Compose postmortem',
      prompt: [
        'Compose a blameless postmortem.',
        'Sections: Summary · Impact · Timeline (with timestamps) · Root cause · Contributing factors · What went well · What went poorly · Action items (each with owner + due date + severity).',
        `Signal: ${JSON.stringify(signal, null, 2)}`,
        `Severity: ${severity}`,
        `Triage: ${JSON.stringify(triage, null, 2)}`,
        `Diagnosis: ${JSON.stringify(diagnosis, null, 2)}`,
        `Mitigation: ${JSON.stringify(mitigation, null, 2)}`,
        `Timeline: ${JSON.stringify(timeline, null, 2)}`,
        'Return JSON: { markdown, actionItems: Array<{ title, owner, dueDate, severity, category: "prevention"|"detection"|"response" }>, postmortemUrl?: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Postmortem', labels: ['observability', 'postmortem'] },
);

const followUpTask = defineTask(
  'incident.follow-up',
  async ({ actionItems }, ctx) => {
    return ctx.agent({
      title: 'Create action-item tracking issues',
      prompt: [
        'Create tracking issues for each action item, labeled `postmortem` + severity tag.',
        `Action items: ${JSON.stringify(actionItems, null, 2)}`,
        'Return JSON: { issues: Array<{ title, url?, number?, action: "created"|"existed" }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Follow-up', labels: ['observability', 'follow-through'] },
);

export async function process(inputs, ctx) {
  const { signal, commsChannels = [], slo } = inputs;
  const timeline = [{ at: signal.firstSeenAt, event: 'signal-received', detail: signal.symptomSummary }];

  // 1) Triage
  const triage = await ctx.task(triageTask, { signal });
  timeline.push({ at: new Date().toISOString(), event: 'triaged', detail: triage.severity });
  if (triage.severity === 'non-incident') {
    return {
      success: true,
      severity: 'non-incident',
      mitigation: { actions: [], mitigated: false, mitigationSummary: 'n/a' },
      recoveryVerified: false,
      actionItems: [],
    };
  }

  // 2) Open comms
  if (commsChannels.length > 0) {
    await ctx.parallel.map(commsChannels, (channel) =>
      ctx.task(commsTask, { channel, phase: 'open', severity: triage.severity, status: triage }),
    );
  }

  // 3) Diagnose (iterate up to 3 passes)
  let diagnosis;
  let hypotheses = triage.initialHypotheses ?? [];
  for (let pass = 1; pass <= 3; pass++) {
    diagnosis = await ctx.task(diagnoseTask, { signal, hypotheses, previousFindings: diagnosis });
    timeline.push({ at: new Date().toISOString(), event: `diagnose-pass-${pass}`, detail: diagnosis.rootCause ?? '(unresolved)' });
    if (!diagnosis.needsMoreSignal && diagnosis.rootCause) break;
    hypotheses = diagnosis.remainingHypotheses ?? hypotheses;
  }

  // 4) Mitigate
  const mitigation = await ctx.task(mitigateTask, { rootCause: diagnosis.rootCause, severity: triage.severity });
  timeline.push({ at: new Date().toISOString(), event: 'mitigation-applied', detail: mitigation.mitigationSummary });

  if (commsChannels.length > 0) {
    await ctx.parallel.map(commsChannels, (channel) =>
      ctx.task(commsTask, { channel, phase: 'mitigated', severity: triage.severity, status: mitigation }),
    );
  }

  // 5) Verify recovery
  const verify = await ctx.task(verifyTask, { mitigation, signal });
  timeline.push({ at: new Date().toISOString(), event: 'recovery-verified', detail: String(verify.recovered) });

  if (commsChannels.length > 0 && verify.recovered) {
    await ctx.parallel.map(commsChannels, (channel) =>
      ctx.task(commsTask, { channel, phase: 'resolved', severity: triage.severity, status: verify }),
    );
  }

  // 6) Postmortem (only for SEV1/SEV2, optional for SEV3)
  let postmortem;
  let actionItems = [];
  if (triage.severity === 'SEV1' || triage.severity === 'SEV2' || triage.severity === 'SEV3') {
    postmortem = await ctx.task(postmortemTask, {
      signal, severity: triage.severity, triage, diagnosis, mitigation, timeline,
    });
    actionItems = postmortem.actionItems ?? [];
    if (actionItems.length > 0) {
      await ctx.task(followUpTask, { actionItems });
    }
  }

  // 7) SLO breach detection
  const slaBreaches = [];
  if (slo) {
    const mttr = (Date.now() - new Date(signal.firstSeenAt).getTime()) / 60000;
    if (mttr > slo.mttrMinutes) {
      slaBreaches.push(`mttr-breach: ${mttr.toFixed(1)}m > ${slo.mttrMinutes}m`);
    }
  }

  return {
    success: verify.recovered === true,
    severity: triage.severity,
    mitigation,
    recoveryVerified: verify.recovered === true,
    postmortemUrl: postmortem?.postmortemUrl,
    actionItems,
    slaBreaches,
  };
}
