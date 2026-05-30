import { createServer } from 'node:http';
import { createKrateRuntime } from './runtime.js';
import { createControllerUiModel } from './controller-ui.js';
import { createKrateApiController } from './api-controller.js';
import { createKubernetesResourceGateway } from './kubernetes-resource-gateway.js';
import { orgNamespaceName } from './kubernetes-controller.js';
import { globalEventBus } from './event-bus.js';
import { clearSnapshotCache } from './snapshot-cache.js';
import { collectKrateHealthProbes, healthStatusValue } from './health-probes.js';

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };

export function createKrateHttpHandler({ runtime = createKrateRuntime(), controller = createKrateApiController({ resourceGateway: createKubernetesResourceGateway() }), healthProbeOptions = {} } = {}) {
  return async function handleKrateRequest(request, response) {
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/healthz') {
        const probes = await collectKrateHealthProbes({ timeoutMs: 3000, eventBus: globalEventBus, ...healthProbeOptions });
        const degraded = Object.values(probes).some((probe) => probe?.status === 'error');
        return send(response, 200, {
          ok: !degraded,
          project: 'Krate',
          status: degraded ? 'degraded' : 'ok',
          health: {
            kubernetes: healthStatusValue(probes.kubernetes),
            gitea: healthStatusValue(probes.gitea),
            agentMux: healthStatusValue(probes.agentMux),
            agentGateway: healthStatusValue(probes.agentGateway),
            controller: healthStatusValue(probes.controller),
            assistant: healthStatusValue(probes.assistant),
            eventTransport: healthStatusValue(probes.eventTransport),
            details: probes,
          },
        });
      }
      if (request.method === 'POST' && url.pathname === '/api/cache/invalidate') { clearSnapshotCache(); return send(response, 200, { ok: true, cleared: true }); }
      if (request.method === 'GET' && url.pathname === '/api/controller') return send(response, 200, createControllerUiModel(await controller.snapshot(), { organization: url.searchParams.get('org') || undefined }));
      if (url.pathname === '/api/orgs') {
        if (request.method === 'GET') return send(response, 200, { organizations: createControllerUiModel(await controller.snapshot()).orgs });
        if (request.method === 'POST') return send(response, 201, await controller.createOrganization(await readJson(request)));
      }
      const orgResourceCollectionMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/resources$/);
      if (orgResourceCollectionMatch) {
        const org = orgResourceCollectionMatch[1];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        if (request.method === 'GET') return send(response, 200, await scopedController.listResource(url.searchParams.get('kind') || 'Repository'));
        if (request.method === 'POST') return send(response, 201, await scopedController.applyResource(scopeResource(await readJson(request), org)));
      }
      const orgResourceMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/resources\/([^/]+)\/([^/]+)$/);
      if (orgResourceMatch) {
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(orgResourceMatch[1]) });
        if (request.method === 'GET') return send(response, 200, await scopedController.getResource(orgResourceMatch[2], orgResourceMatch[3]));
        if (request.method === 'DELETE') return send(response, 200, await scopedController.deleteResource(orgResourceMatch[2], orgResourceMatch[3]));
      }
      const orgRepositoryCollectionMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/repositories$/);
      if (orgRepositoryCollectionMatch) {
        const org = orgRepositoryCollectionMatch[1];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        if (request.method === 'GET') return send(response, 200, await scopedController.listResource('Repository'));
        if (request.method === 'POST') return send(response, 201, await scopedController.createRepository({ ...(await readJson(request)), organizationRef: org }));
      }
      const orgRepositoryMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/repositories\/([^/]+)$/);
      if (orgRepositoryMatch) {
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(orgRepositoryMatch[1]) });
        if (request.method === 'GET') return send(response, 200, await scopedController.getResource('Repository', orgRepositoryMatch[2]));
        if (request.method === 'DELETE') return send(response, 200, await scopedController.deleteResource('Repository', orgRepositoryMatch[2]));
      }

      const orgSnapshotMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/snapshot$/);
      if (orgSnapshotMatch) {
        ensureRuntimeOrg(runtime, orgSnapshotMatch[1]);
        if (request.method === 'GET') return send(response, 200, runtime.snapshot());
        if (request.method === 'POST') return send(response, 200, runtime.importSnapshot(await readJson(request)));
      }
      const runtimeResourceMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/runtime-resources\/([^/]+)$/);
      if (request.method === 'GET' && runtimeResourceMatch) {
        ensureRuntimeOrg(runtime, runtimeResourceMatch[1]);
        return send(response, 200, runtime.controlPlane.list(runtimeResourceMatch[2], { namespace: orgNamespaceName(runtimeResourceMatch[1]) }));
      }
      const objectMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/repositories\/([^/]+)\/objects$/);
      if (request.method === 'POST' && objectMatch) {
        ensureRuntimeOrg(runtime, objectMatch[1]);
        ensureRepository(runtime, objectMatch[2]);
        return send(response, 201, runtime.git.recordObject({ organizationRef: objectMatch[1], repository: objectMatch[2], namespace: orgNamespaceName(objectMatch[1]), ...(await readJson(request)) }));
      }
      const searchIndexMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/repositories\/([^/]+)\/search-index$/);
      if (request.method === 'POST' && searchIndexMatch) {
        ensureRuntimeOrg(runtime, searchIndexMatch[1]);
        ensureRepository(runtime, searchIndexMatch[2]);
        return send(response, 202, runtime.git.enqueueSearchIndex({ organizationRef: searchIndexMatch[1], repository: searchIndexMatch[2], namespace: orgNamespaceName(searchIndexMatch[1]), ...(await readJson(request)) }));
      }
      const pullRequestCollectionMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/pullrequests$/);
      if (request.method === 'POST' && pullRequestCollectionMatch) {
        ensureRuntimeOrg(runtime, pullRequestCollectionMatch[1]);
        return send(response, 201, runtime.createPullRequest({ ...(await readJson(request)), organizationRef: pullRequestCollectionMatch[1] }));
      }
      const reviewMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/pullrequests\/([^/]+)\/reviews$/);
      if (request.method === 'POST' && reviewMatch) {
        ensureRuntimeOrg(runtime, reviewMatch[1]);
        return send(response, 201, runtime.addReview({ ...(await readJson(request)), pullRequest: reviewMatch[2] }));
      }
      const completeMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/pullrequests\/([^/]+)\/checks\/complete$/);
      if (request.method === 'POST' && completeMatch) {
        ensureRuntimeOrg(runtime, completeMatch[1]);
        return send(response, 200, runtime.completePipeline({ pipeline: `pipeline-${completeMatch[2]}`, ...(await readJson(request)) }));
      }
      const mergeMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/pullrequests\/([^/]+)\/merge$/);
      if (request.method === 'POST' && mergeMatch) {
        ensureRuntimeOrg(runtime, mergeMatch[1]);
        return send(response, 200, runtime.mergePullRequest({ ...(await readJson(request)), pullRequest: mergeMatch[2] }));
      }
      const agentApprovalDecideMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/approvals\/([^/]+)\/decide$/);
      if (request.method === 'POST' && agentApprovalDecideMatch) {
        const org = agentApprovalDecideMatch[1];
        const approvalName = agentApprovalDecideMatch[2];
        const body = await readJson(request);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const input = { approvalName, decidedBy: body.decidedBy || 'unknown', reason: body.reason || '' };
        const result = body.decision === 'approve'
          ? await scopedController.approveAgentAction(input)
          : await scopedController.denyAgentAction(input);
        return send(response, result.error ? 400 : 200, result);
      }
      // Agent webhook ingress
      const webhookIngestMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/webhooks\/ingest$/);
      if (request.method === 'POST' && webhookIngestMatch) {
        const org = webhookIngestMatch[1];
        const body = await readJson(request);
        const event = normalizeWebhookEvent(body, org);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.processWebhookEvent({ event, organizationRef: org, namespace: orgNamespaceName(org) });
        return send(response, 200, result);
      }

      // Pipeline failure event
      const pipelineFailMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/events\/pipeline-failure$/);
      if (request.method === 'POST' && pipelineFailMatch) {
        const org = pipelineFailMatch[1];
        const body = await readJson(request);
        const event = { type: 'ci-failure', source: { kind: 'Pipeline', name: body.name || 'unknown', namespace: body.namespace }, repository: body.repository || '', ref: body.ref || 'main', actor: body.actor || 'system', payload: body };
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.processWebhookEvent({ event, organizationRef: org, namespace: orgNamespaceName(org) });
        return send(response, 200, result);
      }

      // Comment event
      const commentMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/events\/comment$/);
      if (request.method === 'POST' && commentMatch) {
        const org = commentMatch[1];
        const body = await readJson(request);
        const event = { type: 'comment', source: { kind: body.kind || 'Issue', name: body.name || 'unknown' }, repository: body.repository || '', ref: body.ref || 'main', actor: body.actor || 'system', payload: { body: body.body || '' } };
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.processWebhookEvent({ event, organizationRef: org, namespace: orgNamespaceName(org) });
        return send(response, 200, result);
      }

      // Label event
      const labelMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/events\/label$/);
      if (request.method === 'POST' && labelMatch) {
        const org = labelMatch[1];
        const body = await readJson(request);
        const event = { type: 'label-added', source: { kind: body.kind || 'Issue', name: body.name || 'unknown' }, repository: body.repository || '', ref: body.ref || 'main', actor: body.actor || 'system', payload: { label: body.label || '' } };
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.processWebhookEvent({ event, organizationRef: org, namespace: orgNamespaceName(org) });
        return send(response, 200, result);
      }

      const agentTriggerProcessMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/triggers\/process$/);
      if (request.method === 'POST' && agentTriggerProcessMatch) {
        const org = agentTriggerProcessMatch[1];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const body = await readJson(request);
        const result = await scopedController.processWebhookEvent({ ...body, organizationRef: org });
        return send(response, 200, result);
      }
      const memoryQueryMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/memory\/query$/);
      if (request.method === 'POST' && memoryQueryMatch) {
        const org = memoryQueryMatch[1];
        const body = await readJson(request);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.queryAgentMemory({ ...body, organizationRef: org });
        return send(response, 200, result);
      }
      // --- Secrets management routes ---
      const orgSecretsMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/secrets$/);
      if (orgSecretsMatch) {
        const org = orgSecretsMatch[1];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        if (request.method === 'GET') {
          const result = await scopedController.listResourceForOrg(org, 'AgentSecretGrant');
          const items = Array.isArray(result?.items) ? result.items : [];
          return send(response, 200, {
            secrets: items.map((item) => ({
              name: item.spec?.secretName || item.spec?.secretRef || item.metadata?.name,
              type: item.spec?.type || 'Opaque',
              createdAt: item.status?.createdAt || item.metadata?.creationTimestamp || null,
              namespace: orgNamespaceName(org),
              grants: []
            }))
          });
        }
        if (request.method === 'POST') {
          const body = await readJson(request);
          const secretResource = {
            apiVersion: 'krate.a5c.ai/v1alpha1',
            kind: 'AgentSecretGrant',
            metadata: { name: body.name, namespace: orgNamespaceName(org) },
            spec: {
              organizationRef: org,
              secretName: body.name,
              secretRef: body.name,
              grantedTo: body.grantedTo || 'system',
              subject: body.grantedTo || 'system',
              permissions: body.permissions || ['read'],
              purpose: 'read',
              data: body.data || {}
            }
          };
          const result = await scopedController.applyResourceForOrg(org, secretResource);
          return send(response, 201, result);
        }
      }

      const orgSecretMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/secrets\/([^/]+)$/);
      if (orgSecretMatch) {
        const org = orgSecretMatch[1];
        const secretName = orgSecretMatch[2];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        if (request.method === 'DELETE') {
          const result = await scopedController.deleteResourceForOrg(org, 'AgentSecretGrant', secretName);
          return send(response, 200, result);
        }
      }

      const orgSecretGrantsMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/secret-grants$/);
      if (orgSecretGrantsMatch) {
        const org = orgSecretGrantsMatch[1];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        if (request.method === 'GET') {
          return send(response, 200, await scopedController.listResourceForOrg(org, 'AgentSecretGrant'));
        }
        if (request.method === 'POST') {
          const body = await readJson(request);
          const grant = {
            apiVersion: 'krate.a5c.ai/v1alpha1',
            kind: 'AgentSecretGrant',
            metadata: { name: body.name || `grant-${Date.now()}`, namespace: orgNamespaceName(org) },
            spec: {
              organizationRef: org,
              secretName: body.secretName,
              secretRef: body.secretName,
              grantedTo: body.grantedTo,
              subject: body.grantedTo,
              permissions: body.permissions || ['read'],
              purpose: (body.permissions || ['read']).join(',')
            }
          };
          return send(response, 201, await scopedController.applyResourceForOrg(org, grant));
        }
      }

      // --- External integration routes ---
      const externalSyncMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/external\/sync$/);
      if (request.method === 'POST' && externalSyncMatch) {
        const org = externalSyncMatch[1];
        const body = await readJson(request);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const bindingName = body.bindingName || '';
        const result = await scopedController.syncExternalBinding(bindingName, {
          kind: body.kind,
          localName: body.localName,
          namespace: orgNamespaceName(org),
          spec: body.spec || {},
          externalEnvelope: body.externalEnvelope || { nativeId: '', url: '', etag: '', providerRef: '' },
          watermark: body.watermark
        });
        return send(response, 200, result);
      }

      const externalConflictResolveMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/external\/conflicts\/([^/]+)\/resolve$/);
      if (request.method === 'POST' && externalConflictResolveMatch) {
        const org = externalConflictResolveMatch[1];
        const conflictName = externalConflictResolveMatch[2];
        const body = await readJson(request);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.resolveExternalConflict({ conflictName, strategy: body.strategy, resolvedValue: body.resolvedValue, resources: body.resources || {} });
        return send(response, 200, result);
      }

      const externalWriteIntentApproveMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/external\/write-intents\/([^/]+)\/approve$/);
      if (request.method === 'POST' && externalWriteIntentApproveMatch) {
        const org = externalWriteIntentApproveMatch[1];
        const intentName = externalWriteIntentApproveMatch[2];
        const body = await readJson(request);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.approveExternalWriteIntent({ intentName, approvedBy: body.approvedBy || 'unknown', resources: body.resources || {} });
        return send(response, 200, result);
      }

      const externalWriteIntentCancelMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/external\/write-intents\/([^/]+)\/cancel$/);
      if (request.method === 'POST' && externalWriteIntentCancelMatch) {
        const org = externalWriteIntentCancelMatch[1];
        const intentName = externalWriteIntentCancelMatch[2];
        const body = await readJson(request);
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const result = await scopedController.cancelExternalWriteIntent({ intentName, cancelledBy: body.cancelledBy || 'unknown', resources: body.resources || {} });
        return send(response, 200, result);
      }

      const sseMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/events\/stream$/);
      if (request.method === 'GET' && sseMatch) {
        const replayCursor = request.headers['last-event-id'] || url.searchParams.get('cursor') || '';
        const sentIds = new Set();
        response.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        const writer = (event) => {
          if (event?.id) {
            if (sentIds.has(event.id)) return;
            sentIds.add(event.id);
          }
          if (event?.id) response.write(`id: ${event.id}\n`);
          response.write(`data: ${JSON.stringify(event)}\n\n`);
        };
        globalEventBus.subscribe(writer);
        response.write('data: {"type":"connected"}\n\n');
        for (const event of await globalEventBus.replaySince(replayCursor)) writer(event);
        const interval = setInterval(() => {
          response.write('data: {"type":"heartbeat"}\n\n');
        }, 30000);
        request.on('close', () => {
          clearInterval(interval);
          globalEventBus.unsubscribe(writer);
        });
        return;
      }
      return send(response, 404, { error: 'not_found', method: request.method, path: url.pathname });
    } catch (error) {
      return send(response, 400, { error: 'bad_request', message: error.message });
    }
  };
}

export function createKrateHttpServer(options = {}) {
  return createServer(createKrateHttpHandler(options));
}


function scopeResource(resource, org) {
  const namespace = orgNamespaceName(org);
  return {
    ...resource,
    metadata: { ...(resource.metadata || {}), namespace, labels: { ...(resource.metadata?.labels || {}), 'krate.a5c.ai/org': org, 'krate.a5c.ai/namespace': namespace } },
    spec: { ...(resource.spec || {}), organizationRef: org }
  };
}

function ensureRuntimeOrg(runtime, org) {
  if (runtime.organizationRef !== org || runtime.namespace !== orgNamespaceName(org)) throw new Error(`Runtime is scoped to ${runtime.organizationRef}`);
}

function ensureRepository(runtime, repository) {
  const existing = runtime.controlPlane.get('Repository', runtime.namespace, repository);
  if (!existing) throw new Error(`Repository ${repository} not found`);
  return existing;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function send(response, status, body) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(body, null, 2));
}

export function normalizeWebhookEvent(body, org) {
  // GitHub/Gitea webhook normalization
  if (body.action === 'completed' && body.workflow_run?.conclusion === 'failure') {
    return { type: 'ci-failure', source: { kind: 'Pipeline', name: body.workflow_run?.name || 'unknown' }, repository: body.repository?.full_name || '', ref: body.workflow_run?.head_branch || 'main', actor: body.sender?.login || 'system', payload: body };
  }
  if (body.action === 'opened' && body.pull_request) {
    return { type: 'pr-opened', source: { kind: 'PullRequest', name: String(body.pull_request.number) }, repository: body.repository?.full_name || '', ref: body.pull_request?.head?.ref || 'main', actor: body.sender?.login || 'system', payload: body };
  }
  if (body.action === 'created' && body.comment) {
    const kind = body.issue?.pull_request ? 'PullRequest' : 'Issue';
    return { type: 'comment', source: { kind, name: String(body.issue?.number || 'unknown') }, repository: body.repository?.full_name || '', ref: 'main', actor: body.sender?.login || body.comment?.user?.login || 'system', payload: { body: body.comment?.body || '' } };
  }
  if (body.action === 'labeled') {
    return { type: 'label-added', source: { kind: body.pull_request ? 'PullRequest' : 'Issue', name: String(body.issue?.number || body.pull_request?.number || 'unknown') }, repository: body.repository?.full_name || '', ref: 'main', actor: body.sender?.login || 'system', payload: { label: body.label?.name || '' } };
  }
  if (body.action === 'opened' && body.issue && !body.pull_request) {
    return { type: 'issue-created', source: { kind: 'Issue', name: String(body.issue.number) }, repository: body.repository?.full_name || '', ref: 'main', actor: body.sender?.login || 'system', payload: body };
  }
  if (body.ref && body.commits) {
    return { type: 'push', source: { kind: 'Repository', name: body.repository?.full_name || '' }, repository: body.repository?.full_name || '', ref: body.ref?.replace('refs/heads/', '') || 'main', actor: body.sender?.login || body.pusher?.name || 'system', payload: body };
  }
  // Generic fallback
  return { type: 'webhook', source: { kind: 'WebhookDelivery', name: 'unknown' }, repository: body.repository?.full_name || '', ref: 'main', actor: body.sender?.login || 'system', payload: body };
}
