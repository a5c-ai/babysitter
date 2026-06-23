import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse } from '../../../../lib/api-errors.js';
import { buildGeneratedViewResource } from '../../../../lib/assistant-runtime.js';

export const dynamic = 'force-dynamic';

// Save (or update) a generated widget/view/screen as a durable KradleGeneratedView.
// Used by the assistant "generate" UI's Save button with the already-generated
// HTML, so saving doesn't re-run the model.
export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.html || typeof body.html !== 'string') return errorResponse('html is required', 400);
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const resource = buildGeneratedViewResource(org, {
      name: body.name || 'view',
      title: body.title,
      viewType: body.viewType || 'widget',
      html: body.html,
    });
    if (body.sourceTask) resource.spec.sourceTask = body.sourceTask;
    await controller.applyResource(resource);
    return Response.json(
      { name: resource.metadata.name, viewUrl: `/api/orgs/${org}/views/${resource.metadata.name}` },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return errorResponse(err.message || 'Failed to save view', 500);
  }
});

// Lists saved KradleGeneratedView resources (widgets/views/screens) so they can
// be browsed and reused. Content is omitted from the list (fetch the per-view
// route to render it); metadata only here.
export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
  try {
    const result = await controller.listResourceForOrg(org, 'KradleGeneratedView');
    const items = (result?.items || result || []).map((v) => ({
      name: v?.metadata?.name,
      title: v?.spec?.title || v?.metadata?.name,
      viewType: v?.spec?.viewType || 'widget',
      sourceTask: v?.spec?.sourceTask || null,
      createdAt: v?.metadata?.creationTimestamp || null,
      viewUrl: `/api/orgs/${org}/views/${v?.metadata?.name}`,
    }));
    return Response.json({ total: items.length, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Failed to list views', 500);
  }
});
