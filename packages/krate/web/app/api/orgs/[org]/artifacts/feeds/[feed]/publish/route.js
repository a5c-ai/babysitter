import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

const MAX_ARTIFACT_SIZE = 1073741824; // 1 GB
const SEMVER_LIKE = /^[0-9]+\.[0-9]+\.[0-9]+([._+-].+)?$/;
const HEX_STRING = /^[0-9a-fA-F]+$/;

export const POST = withAuth(async (request, { params }) => {
  const { org, feed } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const input = await request.json();

    // --- Input validation ---
    if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
      return errorResponse('name is required', 400);
    }
    if (input.name.length > 256) {
      return errorResponse('name must be 256 characters or fewer', 400);
    }
    if (!input.version || typeof input.version !== 'string' || !input.version.trim()) {
      return errorResponse('version is required', 400);
    }
    if (!SEMVER_LIKE.test(input.version)) {
      return errorResponse('version must follow semver-like format (e.g. 1.0.0)', 400);
    }
    if (input.size != null) {
      const size = Number(input.size);
      if (!Number.isFinite(size) || size <= 0) {
        return errorResponse('size must be a positive number', 400);
      }
      if (size > MAX_ARTIFACT_SIZE) {
        return errorResponse(`size must not exceed ${MAX_ARTIFACT_SIZE} bytes (1 GB)`, 400);
      }
    }
    if (input.digest != null && input.digest !== '') {
      if (typeof input.digest !== 'string' || !HEX_STRING.test(input.digest)) {
        return errorResponse('digest must be a hex string', 400);
      }
    }

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'ArtifactVersion',
      metadata: {
        name: `${feed}-${input.name || 'pkg'}-${(input.version || 'latest').replace(/\./g, '-')}`,
        namespace,
        labels: {
          'krate.a5c.ai/feed': feed,
        },
      },
      spec: {
        organizationRef: org,
        feedRef: feed,
        name: input.name,
        version: input.version,
        digest: input.digest || '',
        size: input.size || 0,
        publishedBy: input.publishedBy || 'unknown',
        metadata: input.metadata || {},
      },
    };
    const result = await controller.applyResource(resource);
    clearSnapshotCache();
    invalidateApiCache();
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, error.message?.includes('not found') ? 404 : 500);
  }
});
