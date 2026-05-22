import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';


export async function GET(_request, { params }) {
  const { org, kind, name } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    return Response.json(await controller.getResourceForOrg(org, kind, name), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
}

export const PATCH = withAuth(async (request, { params }) => {
  const { org, kind, name } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const existingResult = await controller.getResourceForOrg(org, kind, name);
    const existing = existingResult?.resource || existingResult;
    const patch = await request.json();
    const resource = mergeResourcePatch(existing, patch, { kind, name });
    const result = await controller.applyResourceForOrg(org, resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 400);
  }
});

export const POST = PATCH;

export const DELETE = withAuth(async (_request, { params }) => {
  const { org, kind, name } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const result = await controller.deleteResourceForOrg(org, kind, name);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});

export function mergeResourcePatch(existing = {}, patch = {}, fallback = {}) {
  return deepMerge({
    apiVersion: existing.apiVersion || patch.apiVersion || 'krate.a5c.ai/v1alpha1',
    kind: existing.kind || patch.kind || fallback.kind,
    metadata: { ...(existing.metadata || {}), name: existing.metadata?.name || patch.metadata?.name || fallback.name },
    spec: existing.spec || {},
    status: existing.status || {}
  }, patch);
}

function deepMerge(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch === undefined ? base : patch;
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    merged[key] = isPlainObject(value) ? deepMerge(base[key] || {}, value) : value;
  }
  return merged;
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}
