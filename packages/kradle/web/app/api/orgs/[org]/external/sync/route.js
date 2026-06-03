import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  try {
    const controller = createKradleApiController({ namespace: orgNamespaceName(org) });
    const body = await request.json();
    const result = await controller.syncExternalBinding(body.bindingName, {
      kind: body.kind,
      localName: body.localName,
      namespace: body.namespace ?? orgNamespaceName(org),
      spec: body.spec,
      externalEnvelope: body.externalEnvelope,
      watermark: body.watermark,
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
