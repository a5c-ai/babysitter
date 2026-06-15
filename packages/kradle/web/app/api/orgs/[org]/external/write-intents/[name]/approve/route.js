import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }, session) => {
  const { org, name } = await params;
  try {
    const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
    const body = await request.json();
    const result = await controller.approveExternalWriteIntent({
      intentName: name,
      approvedBy: body.approvedBy || session?.user || 'system',
      resources: body.resources || {}
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
