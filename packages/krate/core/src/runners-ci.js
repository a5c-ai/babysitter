import { createResource } from './resource-model.js';
import { serviceAccountForJob } from './identity-policy.js';

export class RunnerScheduler {
  constructor({ controlPlane }) { this.controlPlane = controlPlane; }

  createRunnerPool({ name, namespace = 'krate-org-default', organizationRef = 'default', image = 'ubuntu:24.04', warmReplicas = 1, maxReplicas = 10, trustTier = 'trusted', cache = { type: 'object-storage' } }, user) {
    return this.controlPlane.create(createResource('RunnerPool', { name, namespace, labels: { trustTier } }, {
      organizationRef, image, warmReplicas, maxReplicas, trustTier, cache, scalingMetric: 'queueDepth'
    }, { readyReplicas: warmReplicas, queueDepth: 0 }), user);
  }

  planReplicas(pool, queueDepth) {
    return Math.min(pool.spec.maxReplicas || 0, Math.max(pool.spec.warmReplicas || 0, queueDepth));
  }

  startPipeline({ name, namespace = 'krate-org-default', organizationRef = 'default', repository, ref, actor, steps = ['checkout', 'test'], fork = false, resumeFrom = null }, user) {
    const trustTier = fork ? 'untrusted' : 'trusted';
    const pipeline = this.controlPlane.create(createResource('Pipeline', { name, namespace, labels: { repository, ref, trustTier } }, {
      organizationRef, repository, ref, actor: actor.name, resumeFrom, trustTier, steps
    }, { phase: 'Running', currentStep: resumeFrom || steps[0] }), user);
    const jobs = steps.map((step, index) => this.controlPlane.create(createResource('Job', {
      name: `${name}-${index + 1}-${step}`,
      namespace,
      labels: { pipeline: name, repository, trustTier }
    }, {
      organizationRef: pipeline.spec?.organizationRef || organizationRef,
      pipeline: name,
      step,
      serviceAccount: serviceAccountForJob({ namespace, repository, pipeline: name, trustTier })
    }, { phase: step === (resumeFrom || steps[0]) ? 'Running' : 'Pending' }), user));
    return { pipeline, jobs };
  }

  rerunFromStep(pipeline, step, user) {
    return this.startPipeline({
      name: `${pipeline.metadata.name}-rerun-${step}`,
      namespace: pipeline.metadata.namespace,
      organizationRef: pipeline.spec.organizationRef,
      repository: pipeline.spec.repository,
      ref: pipeline.spec.ref,
      actor: { name: pipeline.spec.actor },
      steps: pipeline.spec.steps,
      resumeFrom: step,
      fork: pipeline.spec.trustTier === 'untrusted'
    }, user);
  }
}
