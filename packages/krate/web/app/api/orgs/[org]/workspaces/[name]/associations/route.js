import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const workspace = await controller.getResource('KrateWorkspace', name, namespace);
    if (!workspace) {
      return errorResponse(`Workspace not found: ${name}`, 404);
    }
    const wsController = controller.workspaceController();
    const result = wsController.listAssociations(workspace);
    if (result.error) {
      return errorResponse(result.message || 'Bad request', 400);
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to list associations', 500);
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();
    if (!body.kind || !body.name) {
      return errorResponse('kind and name are required', 400);
    }
    const workspace = await controller.getResource('KrateWorkspace', name, namespace);
    if (!workspace) {
      return errorResponse(`Workspace not found: ${name}`, 404);
    }
    const wsController = controller.workspaceController();
    const result = wsController.addAssociation(workspace, { kind: body.kind, name: body.name });
    if (result.error) {
      return errorResponse(result.message || 'Failed to add association', 400);
    }
    // Persist updated workspace
    await controller.applyResource(result.workspace);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to add association', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();
    if (!body.kind || !body.name) {
      return errorResponse('kind and name are required', 400);
    }
    const workspace = await controller.getResource('KrateWorkspace', name, namespace);
    if (!workspace) {
      return errorResponse(`Workspace not found: ${name}`, 404);
    }
    const wsController = controller.workspaceController();
    const result = wsController.removeAssociation(workspace, { kind: body.kind, name: body.name });
    if (result.error) {
      return errorResponse(result.message || 'Failed to remove association', 400);
    }
    // Persist updated workspace
    await controller.applyResource(result.workspace);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to remove association', 500);
  }
});
