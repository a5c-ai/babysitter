import { withAuth } from '../../../../../../lib/api-auth.js';
import { errorResponse } from '../../../../../../lib/api-errors.js';
import { getArtifact } from '../../../../../../lib/assistant-runtime.js';

export const dynamic = 'force-dynamic';

// GET: serve a generated artifact (HTML/JSX)
export const GET = withAuth(async (request, { params }) => {
  const { id } = await params;
  try {
    const artifact = getArtifact(id);
    if (!artifact) return errorResponse('Artifact not found', 404);

    const headers = {
      'Content-Type': artifact.contentType || 'text/html',
      'Cache-Control': 'no-store',
    };

    // Serve HTML content directly so it can be rendered in an iframe
    if (artifact.contentType === 'text/html') {
      return new Response(artifact.content, { status: 200, headers });
    }

    return Response.json({ content: artifact.content, contentType: artifact.contentType }, { headers });
  } catch (err) {
    return errorResponse(err.message || 'Failed to serve artifact', 500);
  }
});
