import { createServer } from 'node:http';
import { createKrateRuntime } from './runtime.js';
import { createControllerUiModel } from './controller-ui.js';
import { createKrateApiController } from './api-controller.js';
import { createKubernetesResourceGateway } from './kubernetes-resource-gateway.js';
import { orgNamespaceName } from './kubernetes-controller.js';

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };

export function createKrateHttpHandler({ runtime = createKrateRuntime(), controller = createKrateApiController({ resourceGateway: createKubernetesResourceGateway() }) } = {}) {
  return async function handleKrateRequest(request, response) {
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/healthz') return send(response, 200, { ok: true, project: 'Krate' });
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
      const agentTriggerProcessMatch = url.pathname.match(/^\/api\/orgs\/([^/]+)\/agents\/triggers\/process$/);
      if (request.method === 'POST' && agentTriggerProcessMatch) {
        const org = agentTriggerProcessMatch[1];
        const scopedController = createKrateApiController({ namespace: orgNamespaceName(org) });
        const body = await readJson(request);
        const result = await scopedController.processWebhookEvent({ ...body, organizationRef: org });
        return send(response, 200, result);
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
