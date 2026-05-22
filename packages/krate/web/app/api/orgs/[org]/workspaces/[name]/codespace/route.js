import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../lib/api-errors.js';

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
    const podStatus = workspace.status?.codespace || null;
    const result = wsController.getCodespaceStatus(workspace, podStatus);
    if (result.error) {
      return errorResponse(result.message || 'Bad request', 400);
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to get codespace status', 500);
  }
}

export const POST = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();
    const workspace = await controller.getResource('KrateWorkspace', name, namespace);
    if (!workspace) {
      return errorResponse(`Workspace not found: ${name}`, 404);
    }
    const wsController = controller.workspaceController();
    const result = wsController.launchCodespace(workspace, {
      image: body.image || undefined,
      cpu: body.cpu || undefined,
      memory: body.memory || undefined,
      passwordSecretRef: body.passwordSecretRef || undefined,
      gitAuthorName: body.gitAuthorName || undefined,
      gitAuthorEmail: body.gitAuthorEmail || undefined,
    });
    if (result.error) {
      return errorResponse(result.message || 'Failed to launch codespace', 400);
    }
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to launch codespace', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const workspace = await controller.getResource('KrateWorkspace', name, namespace);
    if (!workspace) {
      return errorResponse(`Workspace not found: ${name}`, 404);
    }
    const wsController = controller.workspaceController();
    const result = wsController.stopCodespace(workspace);
    if (result.error) {
      return errorResponse(result.message || 'Failed to stop codespace', 400);
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to stop codespace', 500);
  }
});
