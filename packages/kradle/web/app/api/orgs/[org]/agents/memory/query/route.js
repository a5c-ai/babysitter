import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  try {
    const namespace = orgNamespaceName(org);
    const controller = createKradleApiController({ namespace });
    const body = await request.json();
    // Scope the query (and the AgentMemoryQuery CR it persists) to THIS org's
    // namespace. Without these the controller defaults organizationRef to
    // 'default' and the query record lands in kradle-org-default.
    const result = await controller.queryAgentMemory({ ...body, namespace, organizationRef: org });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
