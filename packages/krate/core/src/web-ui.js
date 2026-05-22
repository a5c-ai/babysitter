import { createResource } from './resource-model.js';
import { toResourceYaml } from './identity-policy.js';

export function createPullRequestReviewModel({ pullRequest, changedFiles = [], pipelineRuns = [] }) {
  return { layout: 'three-pane-review', panes: ['file-tree', 'diff-and-comments', 'conversation-ci'], keyboardShortcuts: ['j/k file navigation', 'n/p comment navigation', 'a add suggestion', 'm merge'], pullRequest, changedFiles, pipelineRuns, yaml: toResourceYaml(pullRequest) };
}

export function createFailingRunModel({ pipeline, jobs }) {
  const failedJobs = jobs.filter((job) => job.status.phase === 'Failed');
  return { layout: 'live-run-debugger', stream: 'sse', pipeline, failedJobs, actions: ['copy failure', 'find similar runs', 'rerun from step'], similarRunSelector: failedJobs.map((job) => job.metadata.labels).filter(Boolean) };
}

export function createRunnerPoolEditor(pool) {
  return { layout: 'split-form-yaml', fields: ['image', 'resources', 'nodeSelector', 'warmReplicas', 'maxReplicas', 'trustTier', 'cache'], resource: pool, yaml: toResourceYaml(pool), saveModes: ['apply', 'copy kubectl', 'open platform-config PR'] };
}

export function createWebhookInspector({ subscription, deliveries }) {
  return { layout: 'webhook-inspector', subscription, deliveries, columns: ['phase', 'latency', 'attempts', 'response', 'signature'], actions: ['send test delivery', 'inspect headers/body/response', 'replay'] };
}

export function createPolicyRolloutModel(policy) {
  return { layout: 'policy-authoring', modes: ['template', 'CEL/raw'], rollout: ['preview', 'audit', 'enforce'], policy, yaml: toResourceYaml(policy) };
}

export function createTriageView({ name, namespace = 'krate-org-default', organizationRef = 'default', selector }) {
  return createResource('View', { name, namespace, labels: { purpose: 'triage' } }, { organizationRef, selector, columns: ['kind', 'repository', 'priority', 'assignee', 'status'], shareable: true }, { saved: true });
}

export function createDashboard({ repositories, pullRequests, pipelines, runnerPools, webhookDeliveries }) {
  return {
    product: 'Krate',
    principles: ['Kubernetes is the backend', 'CRDs are contracts', 'GitOps transparency'],
    repositories,
    pullRequests,
    pipelines,
    runnerPools,
    webhookDeliveries,
    excellentFlows: ['Open and review a PR', 'Debug a failing run', 'Configure a runner pool', 'Add a webhook and verify it works', 'Write a PR policy with audit-to-enforce rollout', 'Cross-repo triage with saved filters']
  };
}
