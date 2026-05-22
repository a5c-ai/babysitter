import { createKrateApiController, orgNamespaceName, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { errorResponse, invalidateApiCache } from '../../../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

// Intentionally unauthenticated: this endpoint is called by agent pods (Kubernetes Jobs)
// that have no user session. Identity is verified via the run name + namespace binding.
// Do not add withAuth here.

/**
 * POST /api/orgs/[org]/agents/runs/[name]/callback
 *
 * Called by agent containers (K8s Jobs) when they complete or fail.
 * The agent posts its final status, transcript, token usage, and artifacts.
 *
 * Body: {
 *   status: 'completed' | 'failed',
 *   result?: object,
 *   transcript?: Array<{ role: string, content: string }>,
 *   tokenUsage?: { inputTokens: number, outputTokens: number },
 *   artifacts?: Array<{ name: string, type: string, data?: string }>,
 *   error?: string,
 * }
 */
export async function POST(request, { params }) {
  const { org, name } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });

  try {
    const body = await request.json();
    const { status, result, transcript, tokenUsage, artifacts, error: errorMsg } = body;

    if (!status || !['completed', 'failed'].includes(status)) {
      return errorResponse('status must be "completed" or "failed"', 400);
    }

    // 1. Fetch the current run
    const existing = await controller.getResource('AgentDispatchRun', name);
    const run = existing?.resource || existing;
    if (!run) {
      return errorResponse(`Run '${name}' not found`, 404);
    }

    const now = new Date().toISOString();

    // 2. Update run status
    const patched = {
      ...run,
      status: {
        ...(run.status || {}),
        phase: status === 'completed' ? 'Completed' : 'Failed',
        ...(status === 'completed' ? { completedAt: now } : { failedAt: now }),
        ...(errorMsg ? { failureReason: errorMsg } : {}),
        ...(result ? { result } : {}),
        ...(tokenUsage ? { tokenUsage } : {}),
      },
    };

    await controller.applyResource(patched);
    clearSnapshotCache();
    invalidateApiCache();

    // 3. Persist transcript if provided
    if (transcript && Array.isArray(transcript) && transcript.length > 0) {
      const transcriptResource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'AgentSessionTranscript',
        metadata: {
          name: `transcript-${name}`,
          namespace,
        },
        spec: {
          organizationRef: org,
          sessionRef: name,
          messages: transcript.map(msg => ({
            role: msg.role || 'unknown',
            content: msg.content || '',
            timestamp: msg.timestamp || now,
          })),
          cost: {
            inputTokens: tokenUsage?.inputTokens || 0,
            outputTokens: tokenUsage?.outputTokens || 0,
            totalTokens: (tokenUsage?.inputTokens || 0) + (tokenUsage?.outputTokens || 0),
          },
        },
        status: {
          phase: 'Reconciled',
          reconciledAt: now,
        },
      };
      await controller.applyResource(transcriptResource);
      clearSnapshotCache();
    invalidateApiCache();
    }

    // 4. Persist artifacts if provided
    if (artifacts && Array.isArray(artifacts)) {
      for (const artifact of artifacts) {
        const artifactResource = {
          apiVersion: 'krate.a5c.ai/v1alpha1',
          kind: 'AgentArtifact',
          metadata: {
            name: `${name}-artifact-${artifact.name}`,
            namespace,
          },
          spec: {
            organizationRef: org,
            runRef: name,
            artifactName: artifact.name,
            artifactType: artifact.type || 'file',
            data: artifact.data || null,
          },
        };
        await controller.applyResource(artifactResource);
        clearSnapshotCache();
    invalidateApiCache();
      }
    }

    return Response.json(
      { error: false, run: name, status, receivedAt: now },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return errorResponse(err.message || 'Callback processing failed', 500);
  }
}
