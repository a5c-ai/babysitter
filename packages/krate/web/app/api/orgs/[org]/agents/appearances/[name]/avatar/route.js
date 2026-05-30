import { createKrateApiController, orgNamespaceName, clearSnapshotCache, validateResource } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const contentType = request.headers.get('content-type') || '';
    let avatar = {};
    if (contentType.includes('application/json')) {
      const body = await request.json();
      avatar = body.avatar || { type: body.type || 'url', url: body.url, fallbackInitials: body.fallbackInitials };
    } else {
      const form = await request.formData();
      avatar = { type: 'url', url: String(form.get('url') || ''), fallbackInitials: String(form.get('fallbackInitials') || '') };
    }
    if (!avatar.url && avatar.type === 'url') return errorResponse('avatar.url is required', 422);
    const existingResult = await controller.getResourceForOrg(org, 'AgentAppearance', name).catch(() => null);
    const existing = existingResult?.resource || existingResult || {};
    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'AgentAppearance',
      metadata: { ...(existing.metadata || {}), name, namespace },
      spec: { ...(existing.spec || {}), organizationRef: org, avatar },
    };
    validateResource(resource);
    const result = await (controller.applyResourceForOrg?.(org, resource) || controller.applyResource(resource));
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message || 'Avatar upload failed', 400);
  }
});
