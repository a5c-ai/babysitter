import { createKradleApiController, orgNamespaceName, clearSnapshotCache, validateResource, globalEventBus } from '@a5c-ai/kradle-sdk';
import { errorResponse, invalidateApiCache } from '../../../../lib/api-errors.js';

export const IDENTITY_KIND_PATHS = {
  AgentPersona: 'personas',
  AgentSoul: 'souls',
  AgentAppearance: 'appearances',
  AgentVoiceProfile: 'voices',
  AgentDefinition: 'definitions',
};

export function identityController(org) {
  const namespace = orgNamespaceName(org);
  return { namespace, controller: createKradleApiController({ namespace }) };
}

function resourceNameFromBody(body, fallback) {
  return body?.metadata?.name || body?.name || fallback;
}

export function scopedIdentityResource({ org, namespace, kind, name, body = {}, specDefaults = {} }) {
  const resource = body.kind ? body : {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind,
    metadata: { name: resourceNameFromBody(body, name) },
    spec: body.spec || body,
  };
  const metadataName = resourceNameFromBody(resource, name);
  return {
    ...resource,
    kind,
    metadata: {
      ...(resource.metadata || {}),
      name: metadataName,
      namespace,
      labels: {
        ...(resource.metadata?.labels || {}),
        'kradle.a5c.ai/org': org,
        'kradle.a5c.ai/namespace': namespace,
      },
    },
    spec: {
      ...specDefaults,
      ...(resource.spec || {}),
      organizationRef: org,
    },
  };
}

export async function listIdentityResources(request, params, kind) {
  const { org } = await params;
  const { controller } = identityController(org);
  try {
    const result = await controller.listResourceForOrg(org, kind);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}

export async function createIdentityResource(request, params, kind) {
  const { org } = await params;
  const { namespace, controller } = identityController(org);
  try {
    const body = await request.json();
    const resource = scopedIdentityResource({ org, namespace, kind, body });
    validateResource(resource);
    const result = await (controller.applyResourceForOrg?.(org, resource) || controller.applyResource(resource));
    clearSnapshotCache();
    invalidateApiCache();
    globalEventBus.emit({ type: `${kind.toLowerCase()}-applied`, resource: result.resource || resource, timestamp: new Date().toISOString() });
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, /required|Validation/i.test(error.message) ? 422 : 400);
  }
}

export async function getIdentityResource(params, kind, name) {
  const { org } = await params;
  const { controller } = identityController(org);
  try {
    const result = await controller.getResourceForOrg(org, kind, name);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}

export async function patchIdentityResource(request, params, kind, name, specDefaults = {}) {
  const { org } = await params;
  const { namespace, controller } = identityController(org);
  try {
    const body = await request.json();
    const existingResult = await controller.getResourceForOrg(org, kind, name).catch(() => ({ resource: null }));
    const existing = existingResult.resource || existingResult;
    const merged = scopedIdentityResource({
      org,
      namespace,
      kind,
      name,
      body: {
        ...(existing || {}),
        ...(body.kind ? body : {}),
        metadata: { ...(existing?.metadata || {}), ...(body.metadata || {}), name },
        spec: { ...(existing?.spec || {}), ...specDefaults, ...(body.spec || (body.kind ? {} : body)) },
      },
      specDefaults,
    });
    validateResource(merged);
    const result = await (controller.applyResourceForOrg?.(org, merged) || controller.applyResource(merged));
    clearSnapshotCache();
    invalidateApiCache();
    globalEventBus.emit({ type: `${kind.toLowerCase()}-applied`, resource: result.resource || merged, timestamp: new Date().toISOString() });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, /required|Validation/i.test(error.message) ? 422 : 400);
  }
}

export async function deleteIdentityResource(params, kind, name) {
  const { org } = await params;
  const { controller } = identityController(org);
  try {
    const result = await controller.deleteResourceForOrg(org, kind, name);
    clearSnapshotCache();
    invalidateApiCache();
    globalEventBus.emit({ type: `${kind.toLowerCase()}-deleted`, name, timestamp: new Date().toISOString() });
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 400);
  }
}
